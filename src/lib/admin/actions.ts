"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe/client";
import { PLEDGE_CLASSES } from "@/lib/utils/pledge-classes";

// ── Guard: verify caller is admin ─────────────────────────────────────────────
async function requireAdmin(): Promise<{ id: string } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user === null) return { error: "Not authenticated." };

  const { data: member } = await supabase
    .from("members")
    .select("status")
    .eq("id", user.id)
    .single();

  if (member?.status !== "admin") return { error: "Not authorized." };
  return { id: user.id };
}

// ── Approve a pending member ───────────────────────────────────────────────────
export async function approveMember(
  memberId: string
): Promise<{ error: string } | { success: true }> {
  const guard = await requireAdmin();
  if ("error" in guard) return guard;

  const admin = createAdminClient();

  // Fetch name + email before updating so we can send the welcome email.
  const { data: member } = await admin
    .from("members")
    .select("first_name, email")
    .eq("id", memberId)
    .single();

  const { error } = await admin
    .from("members")
    .update({ status: "member" })
    .eq("id", memberId)
    .eq("status", "pending"); // Safety: only upgrade pending rows

  if (error !== null) return { error: "Failed to approve member." };

  // Fire-and-forget — email failure must not block approval.
  if (member !== null) {
    void import("@/lib/email").then(({ sendWelcomeEmail }) =>
      sendWelcomeEmail({ to: member.email, firstName: member.first_name })
    );
  }

  revalidatePath("/admin/members");
  revalidatePath("/admin");
  return { success: true };
}

// ── Update member profile (admin can edit any field) ──────────────────────────
export async function adminUpdateMember(
  memberId: string,
  data: {
    first_name?: string;
    last_name?: string;
    nickname?: string | null;
    pledge_class?: string | null;
    phone?: string | null;
    city?: string | null;
    state?: string | null;
    home_address?: string | null;
    linkedin_url?: string | null;
    pin_number?: string | null;
    status?: "pending" | "member" | "admin" | "stub";
    big_id?: string | null;
  }
): Promise<{ error: string } | { success: true }> {
  const guard = await requireAdmin();
  if ("error" in guard) return guard;

  // Validate pledge_class if provided
  if (
    data.pledge_class !== undefined &&
    data.pledge_class !== null &&
    data.pledge_class !== "" &&
    !PLEDGE_CLASSES.includes(data.pledge_class)
  ) {
    return { error: "Invalid pledge class." };
  }

  // Validate status if provided
  if (
    data.status !== undefined &&
    !["pending", "member", "admin", "stub"].includes(data.status)
  ) {
    return { error: "Invalid status." };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("members")
    .update(data)
    .eq("id", memberId);

  if (error !== null) {
    if (error.code === "23505") return { error: "That pin number is already in use." };
    return { error: "Failed to update member." };
  }

  // Notify the big brother when an admin sets big_id for another member.
  if (data.big_id !== undefined && data.big_id !== null) {
    const [{ data: little }, { data: big }] = await Promise.all([
      admin.from("members").select("first_name, last_name").eq("id", memberId).single(),
      admin.from("members").select("first_name, last_name, email, status").eq("id", data.big_id).single(),
    ]);

    if (
      little !== null &&
      big !== null &&
      (big.status === "member" || big.status === "admin")
    ) {
      void import("@/lib/email").then(({ sendLittleBrotherNotification }) =>
        sendLittleBrotherNotification({
          to:              big.email,
          bigFirstName:    big.first_name,
          littleFirstName: little.first_name,
          littleLastName:  little.last_name,
        })
      );
    }
  }

  revalidatePath("/admin/members");
  revalidatePath(`/admin/members/${memberId}`);
  revalidatePath("/admin");
  return { success: true };
}

// ── Assign a badge ─────────────────────────────────────────────────────────────
export async function assignBadge(
  memberId: string,
  badgeType: string
): Promise<{ error: string } | { success: true }> {
  const guard = await requireAdmin();
  if ("error" in guard) return guard;

  if (badgeType.trim() === "") return { error: "Badge type cannot be empty." };

  const admin = createAdminClient();
  const { error } = await admin.from("badges").insert({
    member_id:   memberId,
    badge_type:  badgeType.trim(),
    assigned_by: guard.id,
  });

  if (error !== null) return { error: "Failed to assign badge." };

  revalidatePath(`/admin/members/${memberId}`);
  return { success: true };
}

// ── Cancel a pending referral ──────────────────────────────────────────────────
export async function cancelReferral(
  referralId: string
): Promise<{ error: string } | { success: true }> {
  const guard = await requireAdmin();
  if ("error" in guard) return guard;

  const admin = createAdminClient();

  // Only cancel if still pending — idempotent.
  const { error } = await admin
    .from("referrals")
    .update({ status: "expired" })
    .eq("id", referralId)
    .eq("status", "pending");

  if (error !== null) return { error: "Failed to cancel referral." };

  revalidatePath("/admin/referrals");
  return { success: true };
}

// ── Hard delete a referral ────────────────────────────────────────────────────
export async function deleteReferral(
  referralId: string
): Promise<{ error: string } | { success: true }> {
  const guard = await requireAdmin();
  if ("error" in guard) return guard;

  const admin = createAdminClient();

  // Completed referrals represent membership history — block deletion.
  const { data: referral } = await admin
    .from("referrals")
    .select("status")
    .eq("id", referralId)
    .maybeSingle();

  if (referral === null) return { error: "Referral not found." };
  if (referral.status === "completed") {
    return { error: "Cannot delete a completed referral." };
  }

  const { error } = await admin
    .from("referrals")
    .delete()
    .eq("id", referralId);

  if (error !== null) return { error: "Failed to delete referral." };

  revalidatePath("/admin/referrals");
  return { success: true };
}

// ── Hard delete a member ──────────────────────────────────────────────────────
export async function deleteMember(
  memberId: string
): Promise<{ error: string } | { success: true }> {
  const guard = await requireAdmin();
  if ("error" in guard) return guard;

  if (memberId === guard.id) {
    return { error: "You cannot delete your own account." };
  }

  const adminDb = createAdminClient();

  // Deleting from auth.users cascades to public.members via FK + trigger.
  const { error } = await adminDb.auth.admin.deleteUser(memberId);

  if (error !== null) {
    console.error("[deleteMember] auth.admin.deleteUser failed:", error.message);
    return { error: "Failed to delete member." };
  }

  revalidatePath("/admin/members");
  revalidatePath("/admin");
  return { success: true };
}

// ── Reject (hard delete) a pending member ─────────────────────────────────────
export async function rejectMember(
  memberId: string
): Promise<{ error: string } | { success: true }> {
  const guard = await requireAdmin();
  if ("error" in guard) return guard;

  if (memberId === guard.id) {
    return { error: "You cannot reject your own account." };
  }

  const adminDb = createAdminClient();

  // Deleting from auth.users cascades to public.members via FK + trigger.
  const { error } = await adminDb.auth.admin.deleteUser(memberId);

  if (error !== null) {
    console.error("[rejectMember] auth.admin.deleteUser failed:", error.message);
    return { error: "Failed to reject member." };
  }

  revalidatePath("/admin/members");
  revalidatePath("/admin");
  return { success: true };
}

// ── Merge a stub record into an existing member ───────────────────────────────
export async function adminMergeStub(
  realMemberId: string,
  stubId: string
): Promise<{ success: true } | { error: string }> {
  const guard = await requireAdmin();
  if ("error" in guard) return guard;

  const admin = createAdminClient();

  // Fetch both rows in parallel
  const [{ data: real }, { data: stub }] = await Promise.all([
    admin
      .from("members")
      .select("id, pledge_class, pin_number, big_id, nickname, status")
      .eq("id", realMemberId)
      .single(),
    admin
      .from("members")
      .select("id, pledge_class, pin_number, big_id, nickname, status")
      .eq("id", stubId)
      .single(),
  ]);

  if (real === null)              return { error: "Member not found." };
  if (stub === null)              return { error: "Stub not found." };
  if (stub.status !== "stub")     return { error: "Target record is not a stub." };

  // Only overwrite fields that are currently null on the real row
  const updates: { pledge_class?: string | null; pin_number?: string | null; big_id?: string | null; nickname?: string | null } = {};
  if (real.pledge_class === null && stub.pledge_class !== null)
    updates.pledge_class = stub.pledge_class;
  if (real.pin_number === null && stub.pin_number !== null)
    updates.pin_number = stub.pin_number;
  if (real.big_id === null && stub.big_id !== null)
    updates.big_id = stub.big_id;
  if (real.nickname === null && stub.nickname !== null)
    updates.nickname = stub.nickname;

  if (Object.keys(updates).length > 0) {
    // If we're copying pin_number, null it on the stub first to avoid the unique
    // constraint being violated while both rows briefly hold the same value.
    if (updates.pin_number !== undefined) {
      await admin.from("members").update({ pin_number: null }).eq("id", stubId);
    }

    const { error: updateError } = await admin
      .from("members")
      .update(updates)
      .eq("id", realMemberId);
    if (updateError !== null) return { error: "Failed to update member." };
  }

  // Re-point any little brothers that referenced the stub
  const { error: repointError } = await admin
    .from("members")
    .update({ big_id: realMemberId })
    .eq("big_id", stubId);
  if (repointError !== null) {
    console.error("[adminMergeStub] big_id re-point failed:", repointError.message);
  }

  // Delete stub only if no registrations reference it
  const { count } = await admin
    .from("registrations")
    .select("id", { count: "exact", head: true })
    .eq("member_id", stubId);

  if ((count ?? 0) === 0) {
    const { error: deleteError } = await admin.from("members").delete().eq("id", stubId);
    if (deleteError !== null) {
      console.error("[adminMergeStub] stub delete failed:", deleteError.message);
    }
  }

  revalidatePath("/admin/members");
  revalidatePath(`/admin/members/${realMemberId}`);
  revalidatePath("/family-tree");
  return { success: true };
}

// ── Delete a registration ────────────────────────────────────────────────────
export async function deleteRegistration(
  registrationId: string
): Promise<{ success: true } | { error: string }> {
  const guard = await requireAdmin();
  if ("error" in guard) return guard;

  const admin = createAdminClient();

  // registration_guests, event_field_responses, and registration_payments
  // cascade-delete automatically via FK ON DELETE CASCADE constraints.
  const { error } = await admin
    .from("registrations")
    .delete()
    .eq("id", registrationId);

  if (error !== null) {
    console.error("[deleteRegistration] failed:", error.message);
    return { error: "Failed to delete registration." };
  }

  revalidatePath("/admin/registrations");
  return { success: true };
}

// ── Remove a badge ─────────────────────────────────────────────────────────────
export async function removeBadge(
  badgeId: string,
  memberId: string
): Promise<{ error: string } | { success: true }> {
  const guard = await requireAdmin();
  if ("error" in guard) return guard;

  const admin = createAdminClient();
  const { error } = await admin
    .from("badges")
    .delete()
    .eq("id", badgeId);

  if (error !== null) return { error: "Failed to remove badge." };

  revalidatePath(`/admin/members/${memberId}`);
  return { success: true };
}

// ── Get Stripe fee details for the refund confirmation dialog ────────────────
export async function getRefundFeeDetails(
  registrationId: string
): Promise<
  | { error: string }
  | { amountPaid: number; stripeFee: number | null; registrantName: string }
> {
  const guard = await requireAdmin();
  if ("error" in guard) return guard;

  const admin = createAdminClient();

  const { data: reg } = await admin
    .from("registrations")
    .select("stripe_payment_id, registrant_name, amount_paid, event_id")
    .eq("id", registrationId)
    .eq("payment_status", "paid")
    .single();

  if (reg === null) {
    return { error: "Registration not found or is not in a paid state." };
  }

  let amountPaid = reg.amount_paid;
  if (amountPaid === null) {
    const { data: event } = await admin
      .from("events")
      .select("ticket_price")
      .eq("id", reg.event_id)
      .single();
    amountPaid = event?.ticket_price ?? 0;
  }

  // The exact fee is only knowable from Stripe's balance transaction on the
  // original charge — skip it silently (UI shows a "fee unavailable" note)
  // for free events with no payment intent, or if the Stripe lookup fails.
  let stripeFee: number | null = null;
  if (reg.stripe_payment_id !== null && reg.stripe_payment_id !== "") {
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(reg.stripe_payment_id, {
        expand: ["latest_charge.balance_transaction"],
      });
      const charge = typeof paymentIntent.latest_charge === "string" ? null : paymentIntent.latest_charge;
      const balanceTransaction =
        charge !== null && typeof charge.balance_transaction !== "string"
          ? charge.balance_transaction
          : null;
      stripeFee = balanceTransaction !== null ? balanceTransaction.fee / 100 : null;
    } catch (stripeErr) {
      console.error("[getRefundFeeDetails] Stripe lookup failed:", stripeErr);
      stripeFee = null;
    }
  }

  return {
    amountPaid: Number(amountPaid),
    stripeFee,
    registrantName: reg.registrant_name,
  };
}

// ── Mark a registration as refunded ───────────────────────────────────────────
export async function markRegistrationRefunded(
  registrationId: string
): Promise<{ error: string } | { success: true }> {
  const guard = await requireAdmin();
  if ("error" in guard) return guard;

  const admin = createAdminClient();

  // Fetch everything needed for the refund and the confirmation email before
  // issuing the refund, so the data is available regardless of what happens next.
  const { data: reg } = await admin
    .from("registrations")
    .select("stripe_payment_id, registrant_name, email, amount_paid, applied_price, guest_count, event_id")
    .eq("id", registrationId)
    .eq("payment_status", "paid")
    .single();

  if (reg === null) {
    return { error: "Registration not found or is not in a paid state." };
  }

  const { data: event } = await admin
    .from("events")
    .select("title, event_date, ticket_price")
    .eq("id", reg.event_id)
    .single();

  // Attempt Stripe refund for paid events that have a payment intent.
  if (reg.stripe_payment_id !== null && reg.stripe_payment_id !== "") {
    try {
      await stripe.refunds.create({ payment_intent: reg.stripe_payment_id });
    } catch (stripeErr) {
      const msg = stripeErr instanceof Error ? stripeErr.message : "Unknown Stripe error";
      console.error("[markRegistrationRefunded] Stripe refund failed:", msg);
      return { error: `Stripe refund failed: ${msg}` };
    }
  }

  // Update DB only after Stripe succeeds (or for free registrations with no payment intent).
  const { error } = await admin
    .from("registrations")
    .update({ payment_status: "refunded" })
    .eq("id", registrationId)
    .eq("payment_status", "paid");

  if (error !== null) {
    console.error("[markRegistrationRefunded] DB update failed:", error.message);
    return { error: "Stripe refund issued but failed to update status. Contact support." };
  }

  if (event !== null) {
    const appliedPrice = reg.applied_price ?? event.ticket_price;
    const amountRefunded =
      reg.amount_paid ?? (1 + reg.guest_count) * appliedPrice;
    const eventDate = new Date(event.event_date).toLocaleDateString("en-US", {
      weekday: "long", month: "long", day: "numeric", year: "numeric",
    });

    void import("@/lib/email").then(({ sendRefundConfirmation }) =>
      sendRefundConfirmation({
        to:             reg.email,
        name:           reg.registrant_name,
        eventTitle:     event.title,
        eventDate,
        amountRefunded: Number(amountRefunded),
      })
    );

    void import("@/lib/email").then(({ sendRefundProcessedAdminAlert }) =>
      sendRefundProcessedAdminAlert({
        registrantName:  reg.registrant_name,
        registrantEmail: reg.email,
        eventTitle:      event.title,
        eventDate,
        amountRefunded:  Number(amountRefunded),
        paymentIntentId: reg.stripe_payment_id ?? "N/A (free event)",
      })
    );
  }

  revalidatePath(`/admin/registrations/${registrationId}`);
  revalidatePath("/admin/registrations");
  return { success: true };
}

// ── Promote a waitlist entry to a registration ────────────────────────────────
export async function promoteFromWaitlist(
  waitlistId: string
): Promise<{ error: string } | { success: true }> {
  const guard = await requireAdmin();
  if ("error" in guard) return guard;

  const admin = createAdminClient();

  // Fetch the waitlist row.
  const { data: entry } = await admin
    .from("waitlist")
    .select("id, member_id, guest_email, guest_name, event_id")
    .eq("id", waitlistId)
    .single();

  if (entry === null) return { error: "Waitlist entry not found." };

  // Resolve registrant info before insert (email + registrant_name are required fields).
  let regEmail: string;
  let regName: string;
  let notifyFirstName = "there";

  if (entry.member_id !== null) {
    const { data: member } = await admin
      .from("members")
      .select("email, first_name, last_name")
      .eq("id", entry.member_id)
      .single();
    if (member === null) return { error: "Member not found." };
    regEmail        = member.email;
    regName         = `${member.first_name} ${member.last_name}`;
    notifyFirstName = member.first_name;
  } else {
    regEmail        = entry.guest_email ?? "";
    regName         = entry.guest_name  ?? "";
    notifyFirstName = entry.guest_name  ?? "there";
  }

  // Create a registration for this person.
  const { error: insertError } = await admin
    .from("registrations")
    .insert({
      event_id:        entry.event_id,
      member_id:       entry.member_id,
      email:           regEmail,
      registrant_name: regName,
      payment_status:  "unpaid",
      guest_count:     0,
    });

  if (insertError !== null) {
    console.error("[promoteFromWaitlist] registration insert failed:", insertError.message);
    return { error: "Failed to create registration." };
  }

  // Remove the waitlist row.
  await admin.from("waitlist").delete().eq("id", waitlistId);

  revalidatePath(`/admin/events/${entry.event_id}/waitlist`);
  revalidatePath("/admin/events");

  // Notify the registrant by email.
  if (regEmail !== "") {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
    const { data: event } = await admin
      .from("events")
      .select("title, slug, id")
      .eq("id", entry.event_id)
      .single();

    if (event !== null) {
      const slug = event.slug ?? event.id;
      void import("@/lib/email").then(({ sendWaitlistPromotionNotification }) =>
        sendWaitlistPromotionNotification({
          to:              regEmail,
          firstName:       notifyFirstName,
          eventTitle:      event.title,
          registrationUrl: `${appUrl}/events/${slug}/register`,
        })
      );
    }
  }

  return { success: true };
}
