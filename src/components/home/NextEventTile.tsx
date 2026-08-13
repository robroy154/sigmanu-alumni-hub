import Link from "next/link";
import { MapPin } from "lucide-react";
import { eventHref } from "@/lib/events/slug";

interface NextEventTileProps {
  event: {
    id:            string;
    slug:          string | null;
    title:         string;
    event_date:    string;
    location:      string | null;
    ticket_price:  number;
    capacity:      number | null;
    capacity_mode: string;
  };
  registeredCount: number;
  isRegistered: boolean;
}

function daysUntilLabel(eventDate: Date): string {
  const diffMs = eventDate.getTime() - Date.now();
  const days = Math.ceil(diffMs / 86400000);
  if (days <= 0) return "TODAY";
  if (days === 1) return "IN 1 DAY";
  return `IN ${days} DAYS`;
}

export function NextEventTile({ event, registeredCount, isRegistered }: NextEventTileProps) {
  const eventDate = new Date(event.event_date);
  const showMeter = event.capacity_mode !== "unlimited" && event.capacity !== null;
  const pct = showMeter && event.capacity !== null
    ? Math.min(100, Math.round((registeredCount / event.capacity) * 100))
    : 0;
  const nearlyFull = showMeter && pct >= 90;

  return (
    <div className="md:col-span-2 lg:row-span-2 bg-sn-surface border border-white/8 rounded-2xl p-5 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-sn-gold" />
        <p className="text-sn-gold text-[10px] font-semibold tracking-[0.16em] uppercase">
          Next Event · {daysUntilLabel(eventDate)}
        </p>
      </div>

      <h3 className="font-heading text-sn-off-white text-2xl leading-[1.14] tracking-tight">
        {event.title}
      </h3>

      <p className="text-sn-gray-text text-[13px] leading-relaxed">
        {eventDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
        {" · "}
        {eventDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
        {event.location !== null && (
          <>
            <br />
            <span className="inline-flex items-center gap-1 mt-0.5">
              <MapPin size={12} className="text-sn-gray-medium" />
              {event.location}
            </span>
          </>
        )}
      </p>

      <div className="mt-auto flex flex-col gap-1.5">
        {showMeter && (
          <>
            <div className="flex justify-between text-[11px] font-medium text-sn-gray-medium">
              <span>Seats claimed</span>
              <span className={nearlyFull ? "text-amber-400" : "text-sn-gold-light"}>
                {registeredCount} / {event.capacity}
              </span>
            </div>
            <div className="h-1.25 rounded-full bg-white/8 overflow-hidden">
              <div
                className={`h-full ${nearlyFull ? "bg-amber-400" : "bg-sn-gold"}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            {nearlyFull && (
              <p className="text-amber-400 text-[11px] font-medium">Nearly full.</p>
            )}
          </>
        )}
        <Link
          href={eventHref(event)}
          className="w-full text-center bg-sn-gold text-sn-black-secondary font-semibold text-[12.5px] rounded-[9px] py-2.75 hover:bg-sn-gold-light transition-colors"
        >
          {isRegistered
            ? "✓ Registered · Manage"
            : `Register · ${event.ticket_price > 0 ? `$${event.ticket_price.toFixed(2)}` : "Free"}`}
        </Link>
      </div>
    </div>
  );
}
