import Link from "next/link";
import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EventForm } from "@/components/admin/EventForm";
import { ArchiveEventButton } from "@/components/admin/ArchiveEventButton";
import { CalendarDays } from "lucide-react";

export const metadata: Metadata = { title: "Admin · Events" };

export default async function AdminEventsPage() {
  const admin = createAdminClient();
  const { data: events } = await admin
    .from("events")
    .select("id, title, slug, event_date, location, ticket_price, capacity, status, event_type, capacity_mode")
    .order("event_date", { ascending: false });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-sn-off-white text-2xl font-bold">Events</h1>
      </div>

      {/* Events table */}
      <div className="bg-sn-surface rounded-xl overflow-hidden">
        {events === null || events.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <CalendarDays className="size-8 text-sn-gray-medium" />
            <p className="text-sn-gray-text text-sm">No events yet. Create your first event below.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left px-4 py-3 text-sn-gray-text font-medium">Event</th>
                <th className="text-left px-4 py-3 text-sn-gray-text font-medium">Date</th>
                <th className="text-left px-4 py-3 text-sn-gray-text font-medium">Price</th>
                <th className="text-left px-4 py-3 text-sn-gray-text font-medium">Capacity</th>
                <th className="text-left px-4 py-3 text-sn-gray-text font-medium">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {events.map((event) => {
                const date = new Date(event.event_date).toLocaleDateString("en-US", {
                  month: "short",
                  day:   "numeric",
                  year:  "numeric",
                });
                return (
                  <tr key={event.id} className="border-b border-white/5 last:border-0">
                    <td className="px-4 py-3">
                      <span className="text-sn-off-white font-medium">{event.title}</span>
                      {event.location !== null && (
                        <p className="text-sn-gray-medium text-xs mt-0.5">{event.location}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sn-gray-text">{date}</td>
                    <td className="px-4 py-3 text-sn-gray-text">
                      {event.ticket_price > 0
                        ? `$${Number(event.ticket_price).toFixed(2)}`
                        : "Free"}
                    </td>
                    <td className="px-4 py-3 text-sn-gray-text">
                      {event.capacity !== null ? event.capacity : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={event.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        <Link href={`/admin/events/${event.id}/edit`}>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-white/60 hover:text-white h-7 px-2 text-xs"
                          >
                            Edit
                          </Button>
                        </Link>
                        {event.status !== "archived" && (
                          <ArchiveEventButton eventId={event.id} />
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Create new event */}
      <div className="bg-sn-surface rounded-xl p-6 space-y-4">
        <h2 className="text-sn-off-white font-semibold text-lg">New Event</h2>
        <EventForm />
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "published") {
    return (
      <Badge className="bg-sn-gold/20 text-sn-gold border border-sn-gold/30 text-xs">
        Published
      </Badge>
    );
  }
  if (status === "archived") {
    return (
      <Badge className="bg-red-500/10 text-red-400 border border-red-500/20 text-xs">
        Archived
      </Badge>
    );
  }
  return (
    <Badge className="bg-white/5 text-white/40 border border-white/10 text-xs">
      Draft
    </Badge>
  );
}
