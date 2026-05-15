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
  const [{ data: events }, { data: regStats }] = await Promise.all([
    admin
      .from("events")
      .select("id, title, slug, event_date, location, ticket_price, capacity, status, registration_open, event_type, capacity_mode")
      .order("event_date", { ascending: false }),
    admin
      .from("registrations")
      .select("event_id, payment_status, amount_paid, applied_price, guest_count")
      .eq("payment_status", "paid"),
  ]);

  // Aggregate registration counts and revenue per event
  type EventStat = { count: number; revenue: number };
  const eventStatMap = new Map<string, EventStat>();
  for (const r of regStats ?? []) {
    const current = eventStatMap.get(r.event_id) ?? { count: 0, revenue: 0 };
    const amount =
      r.amount_paid !== null && r.amount_paid !== undefined
        ? Number(r.amount_paid)
        : (r.applied_price !== null && r.applied_price !== undefined
            ? Number(r.applied_price)
            : 0) * (1 + (r.guest_count ?? 0));
    eventStatMap.set(r.event_id, { count: current.count + 1, revenue: current.revenue + amount });
  }

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
                <th className="text-left px-4 py-3 text-sn-gray-text font-medium hidden md:table-cell">Date</th>
                <th className="text-left px-4 py-3 text-sn-gray-text font-medium hidden lg:table-cell">Price</th>
                <th className="text-left px-4 py-3 text-sn-gray-text font-medium hidden xl:table-cell">Registered</th>
                <th className="text-left px-4 py-3 text-sn-gray-text font-medium hidden xl:table-cell">Revenue</th>
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
                const stat = eventStatMap.get(event.id);
                return (
                  <tr key={event.id} className="border-b border-white/5 last:border-0">
                    <td className="px-4 py-3">
                      <span className="text-sn-off-white font-medium">{event.title}</span>
                      {event.location !== null && (
                        <p className="text-sn-gray-medium text-xs mt-0.5">{event.location}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sn-gray-text hidden md:table-cell">{date}</td>
                    <td className="px-4 py-3 text-sn-gray-text hidden lg:table-cell">
                      {event.ticket_price > 0
                        ? `$${Number(event.ticket_price).toFixed(2)}`
                        : "Free"}
                    </td>
                    <td className="px-4 py-3 text-sn-gray-text hidden xl:table-cell">
                      {stat !== undefined ? stat.count : 0}
                    </td>
                    <td className="px-4 py-3 text-sn-gray-text hidden xl:table-cell">
                      {stat !== undefined && stat.revenue > 0
                        ? `$${stat.revenue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <StatusBadge status={event.status} />
                        {event.registration_open ? (
                          <span className="text-xs rounded-full bg-green-500/15 text-green-400 border border-green-500/30 px-2 py-0.5">
                            Open
                          </span>
                        ) : (
                          <span className="text-xs rounded-full bg-white/5 text-white/40 border border-white/10 px-2 py-0.5">
                            Closed
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        <Link
                          href={`/events/${event.slug ?? event.id}`}
                          target="_blank"
                          className="text-white/40 hover:text-white text-xs transition-colors"
                          title="View public page"
                        >
                          ↗
                        </Link>
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
