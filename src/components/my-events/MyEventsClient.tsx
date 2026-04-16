"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Calendar, MapPin, Ticket } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ManageRegistration } from "@/components/registration/ManageRegistration";

export interface RegistrationRow {
  id:             string;
  payment_status: string;
  guest_count:    number;
  events: {
    id:                string;
    title:             string;
    event_date:        string;
    location:          string | null;
    ticket_price:      number;
    registration_open: boolean;
  } | null;
}

interface GuestRow {
  id:              string;
  registration_id: string;
  guest_name:      string;
}

interface MyEventsClientProps {
  initialRows: RegistrationRow[];
  userId:      string;
  guests:      GuestRow[];
}

export function MyEventsClient({ initialRows, userId, guests }: MyEventsClientProps) {
  const [rows, setRows] = useState<RegistrationRow[]>(initialRows);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("my-registrations")
      .on(
        "postgres_changes",
        {
          event:  "UPDATE",
          schema: "public",
          table:  "registrations",
          filter: `member_id=eq.${userId}`,
        },
        (payload) => {
          setRows((prev) =>
            prev.map((r) =>
              r.id === (payload.new as { id: string }).id
                ? { ...r, payment_status: (payload.new as { payment_status: string }).payment_status }
                : r
            )
          );
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId]);

  const now = new Date();

  const upcoming = rows
    .filter((r) => r.events !== null && new Date(r.events.event_date) >= now)
    .sort(
      (a, b) =>
        new Date(a.events!.event_date).getTime() -
        new Date(b.events!.event_date).getTime()
    );

  const past = rows.filter(
    (r) => r.events !== null && new Date(r.events.event_date) < now
  );

  return (
    <div className="lg:col-span-2 space-y-8">
      {/* Upcoming */}
      <section>
        <h2 className="text-sn-off-white font-semibold mb-4">Upcoming</h2>
        {upcoming.length === 0 ? (
          <div className="bg-sn-surface rounded-sm px-5 py-8">
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <Calendar className="w-8 h-8 text-sn-gray-medium" />
              <p className="text-sn-gray-text text-sm">No upcoming registrations.</p>
              <Link href="/events" className="text-sn-gold text-sm hover:text-sn-gold-light">
                Browse Events →
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {upcoming.map((r) => (
              <EventRow key={r.id} registration={r} guests={guests} />
            ))}
          </div>
        )}
      </section>

      {/* Past */}
      {past.length > 0 && (
        <section>
          <h2 className="text-sn-off-white font-semibold mb-4">Past</h2>
          <div className="space-y-3">
            {past.map((r) => (
              <EventRow key={r.id} registration={r} guests={guests} past />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function EventRow({
  registration,
  guests,
  past = false,
}: {
  registration: RegistrationRow;
  guests:       GuestRow[];
  past?:        boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  const event = registration.events;
  if (event === null) return null;

  const myGuests    = guests.filter((g) => g.registration_id === registration.id);
  const eventDate   = new Date(event.event_date);
  const total       = event.ticket_price * (1 + registration.guest_count);

  return (
    <div>
      <Link
        href={`/events/${event.id}`}
        className="block bg-sn-surface rounded-sm border-t-2 border-t-sn-gold px-5 py-4 hover:opacity-90 transition-opacity group"
      >
        <div className="flex items-start gap-4">
          {/* Date badge */}
          <div
            className={`shrink-0 text-center rounded-sm px-3 py-2 min-w-13 border ${
              past ? "bg-white/5 border-white/10" : "bg-sn-gold/10 border-sn-gold/20"
            }`}
          >
            <p
              className={`text-xs font-medium uppercase ${
                past ? "text-sn-gray-medium" : "text-sn-gold"
              }`}
            >
              {eventDate.toLocaleDateString("en-US", { month: "short" })}
            </p>
            <p
              className={`font-bold text-lg leading-tight ${
                past ? "text-sn-gray-medium" : "text-sn-off-white"
              }`}
            >
              {eventDate.getDate()}
            </p>
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <p
              className={`font-medium text-sm transition-colors ${
                past
                  ? "text-sn-gray-text"
                  : "text-sn-off-white group-hover:text-sn-gold-light"
              }`}
            >
              {event.title}
            </p>
            {event.location !== null && (
              <p className="flex items-center gap-1 text-sn-gray-medium text-xs mt-0.5">
                <MapPin className="w-3 h-3" />
                {event.location}
              </p>
            )}
            <div className="flex items-center gap-3 mt-1.5">
              <PaymentBadge status={registration.payment_status} />
              <span className="text-sn-gray-medium text-xs">
                {1 + registration.guest_count} attendee{1 + registration.guest_count !== 1 ? "s" : ""}
                {registration.guest_count > 0 && ` (you + ${registration.guest_count} guest${registration.guest_count !== 1 ? "s" : ""})`}
              </span>
              {total > 0 && (
                <span className="flex items-center gap-1 text-sn-gray-medium text-xs">
                  <Ticket className="w-3 h-3" />
                  ${total.toFixed(2)}
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>

      {/* Manage registration toggle — upcoming events only */}
      {!past && (
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="w-full text-sn-gold hover:text-sn-gold-light text-xs py-2 px-5 text-left transition-colors"
        >
          {expanded ? "Hide details ▲" : "Manage registration ▼"}
        </button>
      )}

      {expanded && !past && (
        <div className="pt-1">
          <ManageRegistration
            registration={{
              id:             registration.id,
              guest_count:    registration.guest_count,
              payment_status: registration.payment_status,
              event_id:       event.id,
            }}
            guests={myGuests}
            eventTicketPrice={event.ticket_price}
            registrationOpen={event.registration_open}
          />
        </div>
      )}
    </div>
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
