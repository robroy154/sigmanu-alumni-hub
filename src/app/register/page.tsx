import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";

// Legacy entry point: redirect to the next published event's register page.
// Preserves the pending-approval "Register for an Event" button link.
export default async function RegisterRedirectPage() {
  const admin = createAdminClient();
  const { data: event } = await admin
    .from("events")
    .select("id")
    .eq("status", "published")
    .order("event_date", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (event === null) {
    return (
      <div className="text-center py-20">
        <p className="text-white/60 text-lg">
          No events are currently open for registration.
        </p>
      </div>
    );
  }

  redirect(`/events/${event.id}/register`);
}
