"use server";

import { createClient } from "@/lib/supabase/server";

// ── Change email ──────────────────────────────────────────────────────────────
// Verifies the current password first, then requests an email change.
// Supabase sends a confirmation link to the new address.
export async function changeEmail(
  newEmail:        string,
  currentPassword: string
): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user === null || user.email === undefined) {
    return { error: "Not authenticated." };
  }

  // Verify current password by re-authenticating.
  const { error: authError } = await supabase.auth.signInWithPassword({
    email:    user.email,
    password: currentPassword,
  });

  if (authError !== null) {
    return { error: "Current password is incorrect." };
  }

  // Request the email change (Supabase sends a confirmation to the new address).
  const { error: updateError } = await supabase.auth.updateUser({ email: newEmail });

  if (updateError !== null) {
    return { error: updateError.message };
  }

  return { success: true };
}

// ── Change password ───────────────────────────────────────────────────────────
// Verifies the current password first, then sets the new one.
export async function changePassword(
  currentPassword: string,
  newPassword:     string
): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user === null || user.email === undefined) {
    return { error: "Not authenticated." };
  }

  // Verify current password.
  const { error: authError } = await supabase.auth.signInWithPassword({
    email:    user.email,
    password: currentPassword,
  });

  if (authError !== null) {
    return { error: "Current password is incorrect." };
  }

  // Update to new password.
  const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });

  if (updateError !== null) {
    return { error: updateError.message };
  }

  return { success: true };
}
