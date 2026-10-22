"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { sendPendingConfirmation, notifyAdminsNewMember } from "@/lib/email";

// How recently the member row must have been created/claimed for the caller to
// trigger notifications. The handle_new_user trigger writes the row during
// signUp(), so a real signup is always seconds old by the time this runs.
const RECENT_SIGNUP_WINDOW_MS = 15 * 60 * 1000;

/**
 * Sends the "pending confirmation" email to a new signup and alerts admins.
 *
 * Called from the client right after supabase.auth.signUp(), before a session
 * cookie is reliably available, so it can't use getUser(). Because it is a
 * public server action, it only sends for an address whose member row is still
 * `pending` and was written in the last few minutes; otherwise anyone could use
 * it to send chapter-branded mail to arbitrary addresses. Names come from the
 * database, not the caller. Silently no-ops when the check fails.
 */
export async function sendSignupNotifications({
  to,
}: {
  to:        string;
  firstName: string;
  lastName:  string;
}): Promise<void> {
  const email = to.trim().toLowerCase();
  if (email === "") return;

  const admin = createAdminClient();
  const { data: member } = await admin
    .from("members")
    .select("first_name, last_name, email, status, updated_at")
    .eq("email", email)
    .maybeSingle();

  // updated_at, not created_at: claiming a stub updates an old row in place.
  if (
    member === null ||
    member.status !== "pending" ||
    Date.now() - new Date(member.updated_at).getTime() > RECENT_SIGNUP_WINDOW_MS
  ) {
    return;
  }

  await Promise.allSettled([
    sendPendingConfirmation({ to: member.email, firstName: member.first_name }),
    notifyAdminsNewMember({ firstName: member.first_name, lastName: member.last_name, email: member.email }),
  ]);
}
