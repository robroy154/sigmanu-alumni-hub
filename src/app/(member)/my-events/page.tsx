import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EventsCalendar } from "@/components/my-events/EventsCalendar";

export const metadata: Metadata = { title: "My Events — Sigma Nu Mu Xi Alumni" };

interface Registration {
  id:             string;
  payment_status: string;
  guest_count:    number;
  events: {
    id:         string;
    title:      string;
    event_date: string;
    location:   string | null;
    ticket_price: number;
  } | null;
}

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

  const rows = (registrations ?? []) as Registration[];

  const now = new Date();
  const upcoming = rows.filter(
    (r) => r.events !== null && new Date(r.events.event_date) >= now
  ).sort((a, b) =>
    new Date(a.events!.event_date).getTime() - new Date(b.events!.event_date).getTime()
  );

  const past = rows.filter(
    (r) => r.events !== null && new Date(r.events.event_date) < now
  );

  // Dates for calendar highlights
  const eventDates = rows
    .filter((r) => r.events !== null)
    .map((r) => new Date(r.events!.event_date));

  return (
    <div className="space-y-8">
      <h1 className="text-white text-2xl font-bold">My Events</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Event lists */}
        <div className="lg:col-span-2 space-y-8">

          {/* Upcoming */}
          <section>
            <h2 className="text-white font-semibold mb-3">Upcoming</h2>
            {upcoming.length === 0 ? (
              <div className="bg-sn-black rounded-xl border border-sn-gold/20 px-5 py-8 text-center">
                <p className="text-white/40 text-sm mb-3">No upcoming registrations.</p>
                <Link href="/events" className="text-sn-gold text-sm hover:text-sn-gold-light transition-colors">
                  Browse events →
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {upcoming.map((r) => (
                  <EventRow key={r.id} registration={r} />
                ))}
              </div>
            )}
          </section>

          {/* Past */}
          {past.length > 0 && (
            <section>
              <h2 className="text-white font-semibold mb-3">Past</h2>
              <div className="space-y-3">
                {past.map((r) => (
                  <EventRow key={r.id} registration={r} past />
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Calendar sidebar */}
        <div className="lg:sticky lg:top-6">
          <h2 className="text-white font-semibold mb-3">Calendar</h2>
          <EventsCalendar eventDates={eventDates} />
          <p className="text-white/30 text-xs mt-2 text-center">
            Highlighted days are your registered events.
          </p>
        </div>
      </div>
    </div>
  );
}

function EventRow({
  registration,
  past = false,
}: {
  registration: Registration;
  past?: boolean;
}) {
  const event = registration.events;
  if (event === null) return null;

  const eventDate = new Date(event.event_date);
  const total = event.ticket_price * (1 + registration.guest_count);

  return (
    <Link
      href={`/events/${event.id}`}
      className="block bg-sn-black rounded-xl border border-sn-gold/20 px-5 py-4 hover:border-sn-gold/40 transition-colors group"
    >
      <div className="flex items-start gap-4">
        {/* Date badge */}
        <div className={`shrink-0 text-center rounded-lg px-3 py-2 min-w-[52px] border ${
          past
            ? "bg-white/5 border-white/10"
            : "bg-sn-gold/10 border-sn-gold/20"
        }`}>
          <p className={`text-xs font-medium uppercase ${past ? "text-white/40" : "text-sn-gold"}`}>
            {eventDate.toLocaleDateString("en-US", { month: "short" })}
          </p>
          <p className={`font-bold text-lg leading-tight ${past ? "text-white/40" : "text-white"}`}>
            {eventDate.getDate()}
          </p>
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <p className={`font-medium text-sm transition-colors ${
            past
              ? "text-white/60"
              : "text-white group-hover:text-sn-gold-light"
          }`}>
            {event.title}
          </p>
          {event.location !== null && (
            <p className="text-white/40 text-xs mt-0.5">{event.location}</p>
          )}
          <div className="flex items-center gap-3 mt-1.5">
            <PaymentBadge status={registration.payment_status} />
            {registration.guest_count > 0 && (
              <span className="text-white/30 text-xs">
                +{registration.guest_count} guest{registration.guest_count !== 1 ? "s" : ""}
              </span>
            )}
            {total > 0 && (
              <span className="text-white/30 text-xs">${total.toFixed(2)}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

function PaymentBadge({ status }: { status: string }) {
  if (status === "paid") {
    return (
      <span className="inline-flex items-center rounded-full bg-green-400/10 border border-green-400/30 px-2 py-0.5 text-xs text-green-400">
        Paid
      </span>
    );
  }
  if (status === "refunded") {
    return (
      <span className="inline-flex items-center rounded-full bg-white/5 border border-white/15 px-2 py-0.5 text-xs text-white/40">
        Refunded
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-yellow-400/10 border border-yellow-400/30 px-2 py-0.5 text-xs text-yellow-400">
      Unpaid
    </span>
  );
}
