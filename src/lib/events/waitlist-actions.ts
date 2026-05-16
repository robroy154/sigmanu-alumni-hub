"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

interface JoinWaitlistInput {
  name:  string;
  email: string;
}

export async function joinWaitlist(
  eventId: string,
  data: JoinWaitlistInput
): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const admin = createAdminClient();

  // Prevent duplicates
  if (user !== null) {
    const { data: existing } = await admin
      .from("waitlist")
      .select("id")
      .eq("event_id", eventId)
      .eq("member_id", user.id)
      .maybeSingle();

    if (existing !== null) {
      return { error: "You are already on the waitlist for this event." };
    }
  } else {
    const { data: existing } = await admin
      .from("waitlist")
      .select("id")
      .eq("event_id", eventId)
      .eq("guest_email", data.email)
      .maybeSingle();

    if (existing !== null) {
      return { error: "This email is already on the waitlist for this event." };
    }
  }

  const { error } = await admin.from("waitlist").insert({
    event_id:    eventId,
    member_id:   user?.id ?? null,
    guest_email: user === null ? data.email : null,
    guest_name:  user === null ? data.name  : null,
  });

  if (error !== null) {
    return { error: "Failed to join waitlist. Please try again." };
  }

  return { success: true };
}
