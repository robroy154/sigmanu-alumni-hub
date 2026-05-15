import Link from "next/link";
import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Admin Dashboard" };

export default async function AdminPage() {
  const admin = createAdminClient();

  const [
    { count: pendingCount },
    { count: memberCount },
    { count: stubCount },
    { count: totalReg },
    { count: paidCount },
    { data: revenueRows },
    { data: upcomingEvents },
    { data: recentRegs },
  ] = await Promise.all([
    admin.from("members").select("*", { count: "exact", head: true }).eq("status", "pending"),
    admin.from("members").select("*", { count: "exact", head: true }).in("status", ["member", "admin"]),
    admin.from("members").select("*", { count: "exact", head: true }).eq("status", "stub"),
    admin.from("registrations").select("*", { count: "exact", head: true }),
    admin.from("registrations").select("*", { count: "exact", head: true }).eq("payment_status", "paid"),
    admin.from("registrations").select("guest_count, events(ticket_price)").eq("payment_status", "paid"),
    admin
      .from("events")
      .select("id, title, slug, event_date, registration_open")
      .eq("status", "published")
      .gte("event_date", new Date().toISOString())
      .order("event_date")
      .limit(3),
    admin
      .from("registrations")
      .select("id, registrant_name, amount_paid, applied_price, submitted_at, events(title, ticket_price)")
      .eq("payment_status", "paid")
      .order("submitted_at", { ascending: false })
      .limit(5),
  ]);

  // Fetch paid registration counts for upcoming events
  const upcomingIds = (upcomingEvents ?? []).map((e) => e.id);
  const { data: upcomingRegRows } =
    upcomingIds.length > 0
      ? await admin
          .from("registrations")
          .select("event_id")
          .in("event_id", upcomingIds)
          .eq("payment_status", "paid")
      : { data: [] };

  const upcomingRegCountMap = new Map<string, number>();
  for (const r of upcomingRegRows ?? []) {
    upcomingRegCountMap.set(r.event_id, (upcomingRegCountMap.get(r.event_id) ?? 0) + 1);
  }

  const totalRevenue =
    revenueRows?.reduce((sum, row) => {
      const price =
        Array.isArray(row.events)
          ? (row.events[0]?.ticket_price ?? 0)
          : ((row.events as { ticket_price: number } | null)?.ticket_price ?? 0);
      return sum + (1 + (row.guest_count ?? 0)) * price;
    }, 0) ?? 0;

  return (
    <div className="space-y-8">
      <h1 className="text-sn-off-white text-2xl font-bold">Dashboard</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard
          label="Pending Approvals"
          value={pendingCount ?? 0}
          href="/admin/members?status=pending"
          accent={pendingCount !== null && pendingCount > 0}
        />
        <StatCard
          label="Active Members"
          value={memberCount ?? 0}
          href="/admin/members"
        />
        <StatCard
          label="Unclaimed Stubs"
          value={stubCount ?? 0}
          href="/admin/members?status=stub"
        />
        <StatCard
          label="Registrations"
          value={totalReg ?? 0}
          href="/admin/registrations"
          sub={`${paidCount ?? 0} paid`}
        />
        <StatCard
          label="Revenue"
          value={`$${totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          href="/admin/registrations?status=paid"
        />
      </div>

      {/* Upcoming events + recent registrations widgets */}
      {((upcomingEvents ?? []).length > 0 || (recentRegs ?? []).length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {(upcomingEvents ?? []).length > 0 && (
            <div className="bg-sn-surface rounded-xl border border-sn-gold/20 p-5 space-y-3">
              <h2 className="text-sn-gray-text text-xs font-semibold uppercase tracking-wider">
                Upcoming Events
              </h2>
              <div className="space-y-3">
                {(upcomingEvents ?? []).map((e) => {
                  const regCount = upcomingRegCountMap.get(e.id) ?? 0;
                  return (
                    <div key={e.id} className="flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <Link
                          href={`/admin/events/${e.id}/edit`}
                          className="text-sn-off-white text-sm font-medium hover:text-sn-gold transition-colors truncate block"
                        >
                          {e.title}
                        </Link>
                        <p className="text-sn-gray-medium text-xs">
                          {new Date(e.event_date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-sn-gray-text text-xs">{regCount} paid</span>
                        {e.registration_open ? (
                          <span className="text-xs rounded-full bg-green-500/15 text-green-400 border border-green-500/30 px-2 py-0.5">
                            Open
                          </span>
                        ) : (
                          <span className="text-xs rounded-full bg-white/5 text-white/40 border border-white/10 px-2 py-0.5">
                            Closed
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <Link href="/admin/events" className="text-sn-gold text-xs hover:underline block pt-1">
                Manage events →
              </Link>
            </div>
          )}

          {(recentRegs ?? []).length > 0 && (
            <div className="bg-sn-surface rounded-xl border border-sn-gold/20 p-5 space-y-3">
              <h2 className="text-sn-gray-text text-xs font-semibold uppercase tracking-wider">
                Recent Paid Registrations
              </h2>
              <div className="space-y-3">
                {(recentRegs ?? []).map((r) => {
                  const eventTitle = Array.isArray(r.events)
                    ? (r.events[0]?.title ?? "—")
                    : ((r.events as { title: string } | null)?.title ?? "—");
                  const ticketPrice = Array.isArray(r.events)
                    ? (r.events[0]?.ticket_price ?? 0)
                    : ((r.events as { ticket_price: number } | null)?.ticket_price ?? 0);
                  const amount =
                    r.amount_paid !== null && r.amount_paid !== undefined
                      ? Number(r.amount_paid)
                      : r.applied_price !== null && r.applied_price !== undefined
                        ? Number(r.applied_price)
                        : ticketPrice;
                  return (
                    <div key={r.id} className="flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <Link
                          href={`/admin/registrations/${r.id}`}
                          className="text-sn-off-white text-sm font-medium hover:text-sn-gold transition-colors truncate block"
                        >
                          {r.registrant_name}
                        </Link>
                        <p className="text-sn-gray-medium text-xs truncate">{eventTitle}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sn-off-white text-sm">
                          {ticketPrice > 0 ? `$${amount.toFixed(2)}` : "Free"}
                        </p>
                        <p className="text-sn-gray-medium text-xs">
                          {new Date(r.submitted_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <Link
                href="/admin/registrations?status=paid"
                className="text-sn-gold text-xs hover:underline block pt-1"
              >
                View all paid →
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <QuickLink
          href="/admin/members?status=pending"
          title="Review pending accounts"
          description="Approve or deny new member registrations."
        />
        <QuickLink
          href="/admin/registrations"
          title="Manage registrations"
          description="View all event registrations and export to CSV."
        />
        <QuickLink
          href="/admin/members"
          title="Member directory"
          description="Edit profiles, assign badges, manage big/little relationships."
        />
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  href,
  sub,
  accent = false,
}: {
  label: string;
  value: number | string;
  href: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`rounded-xl border p-5 space-y-1 transition-colors hover:bg-white/5 ${
        accent
          ? "border-amber-500/40 bg-amber-500/10"
          : "border-sn-gold/20 bg-sn-surface"
      }`}
    >
      <p className="text-sn-gray-text text-xs uppercase tracking-wider">{label}</p>
      <p className={`text-2xl font-bold ${accent ? "text-amber-400" : "text-sn-off-white"}`}>
        {value}
      </p>
      {sub !== undefined && (
        <p className="text-sn-gray-medium text-xs">{sub}</p>
      )}
    </Link>
  );
}

function QuickLink({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-sn-gold/20 bg-sn-surface p-5 hover:bg-white/5 transition-colors space-y-1"
    >
      <p className="text-sn-off-white font-medium text-sm">{title} →</p>
      <p className="text-sn-gray-text text-xs">{description}</p>
    </Link>
  );
}
