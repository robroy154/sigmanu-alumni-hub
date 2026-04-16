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
  console.log("[signup-notifications] fired for:", to);
  try {
    const results = await Promise.allSettled([
      sendPendingConfirmation({ to, firstName }),
      notifyAdminsNewMember({ firstName, lastName, email: to }),
    ]);
    console.log("[signup-notifications] results:", JSON.stringify(results));
  } catch (err) {
    console.error("[signup-notifications] threw:", err);
  }
}
