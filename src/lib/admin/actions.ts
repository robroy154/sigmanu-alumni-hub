"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
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
  const updates: Record<string, string | null> = {};
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
