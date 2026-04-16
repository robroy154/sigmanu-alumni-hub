"use server";

import { sendPendingConfirmation, notifyAdminsNewMember } from "@/lib/email";

export async function sendSignupNotifications({
  to,
  firstName,
  lastName,
}: {
  to:        string;
  firstName: string;
  lastName:  string;
}): Promise<void> {
  await Promise.allSettled([
    sendPendingConfirmation({ to, firstName }),
    notifyAdminsNewMember({ firstName, lastName, email: to }),
  ]);
}
