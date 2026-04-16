"use server";

import { sendPendingConfirmation, notifyAdminsNewMember } from "@/lib/email";

export async function sendSignupNotifications({
  to,
  firstName,
}: {
  to: string;
  firstName: string;
}): Promise<void> {
  await Promise.allSettled([
    sendPendingConfirmation({ to, firstName }),
    notifyAdminsNewMember(),
  ]);
}
