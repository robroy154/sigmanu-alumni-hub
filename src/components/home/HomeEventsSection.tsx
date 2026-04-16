"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarOff, MapPin, Ticket } from "lucide-react";
import { ManageRegistration } from "@/components/registration/ManageRegistration";
import { eventHref } from "@/lib/events/slug";

interface HomeEvent {
  id:                string;
  slug:              string | null;
  title:             string;
  event_date:        string;
  location:          string | null;
  ticket_price:      number;
  registration_open: boolean;
}

interface MyRegistration {
  id:             string;
  event_id:       string;
  guest_count:    number;
  payment_status: string;
}

interface MyGuest {
  id:              string;
  registration_id: string;
  guest_name:      string;
}

interface HomeEventsSectionProps {
  events:          HomeEvent[];
  myRegistrations: MyRegistration[];
  myGuests:        MyGuest[];
}

export function HomeEventsSection({
  events,
  myRegistrations,
  myGuests,
}: HomeEventsSectionProps) {
  // Track which event's manage panel is open (one at a time).
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

  function toggleExpand(eventId: string) {
    setExpandedEventId((prev) => (prev === eventId ? null : eventId));
  }

  if (events.length === 0) {
    return (
      <div className="bg-sn-surface rounded-xl px-5 py-8">
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <CalendarOff className="size-8 text-sn-gray-medium" />
          <p className="text-sn-gray-text text-sm">No upcoming events at this time.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {events.map((event) => {
        const eventDate   = new Date(event.event_date);
        const myReg       = myRegistrations.find((r) => r.event_id === event.id) ?? null;
        const myEventGuests = myReg !== null
          ? myGuests.filter((g) => g.registration_id === myReg.id)
          : [];
        const isExpanded  = expandedEventId === event.id;

        return (
          <div key={event.id}>
            <Link
              href={eventHref(event)}
              className="block bg-sn-surface rounded-xl border-t-2 border-t-sn-gold px-5 py-4 hover:opacity-90 transition-opacity group"
            >
              <div className="flex items-start gap-4">
                {/* Date badge */}
                <div className="shrink-0 text-center bg-sn-gold/10 border border-sn-gold/20 rounded-lg px-3 py-2 min-w-13">
                  <p className="text-sn-gold text-xs font-medium uppercase">
                    {eventDate.toLocaleDateString("en-US", { month: "short" })}
                  </p>
                  <p className="text-sn-off-white font-bold text-lg leading-tight">
                    {eventDate.getDate()}
                  </p>
                </div>
                {/* Details */}
                <div className="flex-1 min-w-0">
                  <p className="text-sn-off-white font-medium text-sm group-hover:text-sn-gold-light transition-colors">
                    {event.title}
                  </p>
                  {event.location !== null && (
                    <p className="flex items-center gap-1 text-sn-gray-text text-xs mt-0.5">
                      <MapPin className="w-3 h-3 text-sn-gray-medium" />
                      {event.location}
                    </p>
                  )}
                  {myReg !== null ? (
                    <p className="flex items-center gap-1 text-sn-gold text-xs mt-1 font-medium">
                      ✓ Registered
                    </p>
                  ) : (
                    <p className="flex items-center gap-1 text-sn-gray-medium text-xs mt-1">
                      <Ticket className="w-3 h-3 text-sn-gray-medium" />
                      {event.ticket_price > 0
                        ? `$${event.ticket_price.toFixed(2)}`
                        : "Free"}
                    </p>
                  )}
                </div>
              </div>
            </Link>

            {/* Manage registration toggle — only for registered events */}
            {myReg !== null && (
              <>
                <button
                  type="button"
                  onClick={() => toggleExpand(event.id)}
                  className="w-full text-sn-gold hover:text-sn-gold-light text-xs py-2 px-5 text-left transition-colors"
                >
                  {isExpanded ? "Hide details ▲" : "Manage registration ▼"}
                </button>

                {isExpanded && (
                  <div className="pt-1">
                    <ManageRegistration
                      registration={{
                        id:             myReg.id,
                        guest_count:    myReg.guest_count,
                        payment_status: myReg.payment_status,
                        event_id:       event.id,
                      }}
                      guests={myEventGuests}
                      eventTicketPrice={event.ticket_price}
                      registrationOpen={event.registration_open}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
