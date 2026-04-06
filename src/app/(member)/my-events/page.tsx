import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EventsCalendar } from "@/components/my-events/EventsCalendar";
import { MyEventsClient, type RegistrationRow } from "@/components/my-events/MyEventsClient";

export const metadata: Metadata = { title: "My Events — Sigma Nu Mu Xi Alumni" };

export default async function MyEventsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user === null) redirect("/login");

  const { data: registrations } = await supabase
    .from("registrations")
    .select("id, payment_status, guest_count, events(id, title, event_date, location, ticket_price)")
    .eq("member_id", user.id)
    .order("created_at", { ascending: false });

  const rows = (registrations ?? []) as RegistrationRow[];

  // Dates for calendar highlights
  const eventDates = rows
    .filter((r) => r.events !== null)
    .map((r) => new Date(r.events!.event_date));

  return (
    <div className="space-y-8">
      <h1 className="text-sn-off-white text-2xl font-bold">My Events</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Event lists — client component with Realtime */}
        <MyEventsClient initialRows={rows} userId={user.id} />

        {/* Calendar sidebar */}
        <div className="lg:sticky lg:top-6">
          <h2 className="text-sn-off-white font-semibold mb-3">Calendar</h2>
          <EventsCalendar eventDates={eventDates} />
          <p className="text-sn-gray-medium text-xs mt-2 text-center">
            Highlighted days are your registered events.
          </p>
        </div>
      </div>
    </div>
  );
}
