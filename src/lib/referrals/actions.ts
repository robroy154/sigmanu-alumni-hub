"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// ── Lightweight token check — called before signUp() in JoinForm ──────────────
// Returns the invitee's name and email if the token is valid and pending,
// or an error string if not. Never creates any DB rows.
export async function checkReferralToken(
  token: string
): Promise<{ valid: true; firstName: string; email: string } | { error: string }> {
  const admin = createAdminClient();

  const { data: referral } = await admin
    .from("referrals")
    .select("first_name, email, status, expires_at")
    .eq("token", token)
    .maybeSingle();

  if (referral === null) {
    return { error: "This invite link is invalid or has already been used." };
  }

  if (referral.status === "completed") {
    return { error: "This invite link has already been used." };
  }

  if (referral.status === "expired" || new Date(referral.expires_at) < new Date()) {
    return { error: "This invite link has expired." };
  }

  return { valid: true, firstName: referral.first_name, email: referral.email };
}

interface OptionalProfileFields {
  pledge_class?:   string | undefined;
  phone?:          string | undefined;
  street_address?: string | undefined;
  city?:           string | undefined;
  state?:          string | undefined;
  zip?:            string | undefined;
  country?:        string | undefined;
  birthday?:       string | undefined;
}

// Called from JoinForm after successful supabase.auth.signUp().
// Uses the admin client to:
//   1. Validate the token is still usable
//   2. Write optional profile fields to the new member row
//   3. Set members.referred_by for the new user
//   4. Mark the referral as completed
//   5. Send welcome + referral-completed emails (fire-and-forget)
export async function completeReferral(
  token: string,
  optionalFields: OptionalProfileFields,
): Promise<{ error: string } | { success: true }> {
  // Get the newly created user's session.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user === null) {
    return { error: "Not authenticated." };
  }

  const admin = createAdminClient();

  // Look up referral by token.
  const { data: referral } = await admin
    .from("referrals")
    .select("id, referred_by, first_name, last_name, status, expires_at")
    .eq("token", token)
    .maybeSingle();

  if (referral === null) {
    return { error: "Invite link not found." };
  }

  if (referral.status === "completed") {
    return { error: "This invite link has already been used." };
  }

  if (referral.status === "expired" || new Date(referral.expires_at) < new Date()) {
    return { error: "This invite link has expired." };
  }

  // Build optional profile update payload.
  const profileUpdate: Record<string, string> = {};
  if (optionalFields.pledge_class   !== undefined && optionalFields.pledge_class   !== "") profileUpdate.pledge_class   = optionalFields.pledge_class;
  if (optionalFields.phone          !== undefined && optionalFields.phone          !== "") profileUpdate.phone          = optionalFields.phone;
  if (optionalFields.street_address !== undefined && optionalFields.street_address !== "") profileUpdate.street_address = optionalFields.street_address;
  if (optionalFields.city           !== undefined && optionalFields.city           !== "") profileUpdate.city           = optionalFields.city;
  if (optionalFields.state          !== undefined && optionalFields.state          !== "") profileUpdate.state          = optionalFields.state;
  if (optionalFields.zip            !== undefined && optionalFields.zip            !== "") profileUpdate.zip            = optionalFields.zip;
  if (optionalFields.country        !== undefined && optionalFields.country        !== "") profileUpdate.country        = optionalFields.country;
  if (optionalFields.birthday       !== undefined && optionalFields.birthday       !== "") profileUpdate.birthday       = optionalFields.birthday;

  // Update new member row: optional fields + referred_by.
  const { error: memberUpdateError } = await admin
    .from("members")
    .update({ ...profileUpdate, referred_by: referral.referred_by })
    .eq("id", user.id);

  if (memberUpdateError !== null) {
    console.error("[completeReferral] member update failed:", memberUpdateError);
    // Non-fatal: continue to mark referral complete.
  }

  // Mark referral as completed.
  const { error: referralUpdateError } = await admin
    .from("referrals")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("id", referral.id);

  if (referralUpdateError !== null) {
    console.error("[completeReferral] referral update failed:", referralUpdateError);
  }

  // Fetch referrer's details for emails.
  const { data: referrer } = await admin
    .from("members")
    .select("email, first_name, last_name")
    .eq("id", referral.referred_by)
    .single();

  // Fire-and-forget emails.
  void import("@/lib/email").then(({ sendWelcomeEmail, sendReferralCompleted }) => {
    // Welcome email to new member (same as admin-approval welcome).
    void sendWelcomeEmail({ to: user.email ?? "", firstName: referral.first_name });

    // Notify referrer.
    if (referrer !== null) {
      void sendReferralCompleted({
        to:                referrer.email,
        referrerFirstName: referrer.first_name,
        inviteeFirstName:  referral.first_name,
        inviteeLastName:   referral.last_name,
      });
    }
  });

  return { success: true };
}
