import Link from "next/link";
import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Admin Dashboard" };

export default async function AdminPage() {
  const admin = createAdminClient();

  const [
    { count: pendingCount },
    { count: memberCount },
    { count: totalReg },
    { count: paidCount },
    { data: revenueRows },
  ] = await Promise.all([
    admin.from("members").select("*", { count: "exact", head: true }).eq("status", "pending"),
    admin.from("members").select("*", { count: "exact", head: true }).in("status", ["member", "admin"]),
    admin.from("registrations").select("*", { count: "exact", head: true }),
    admin.from("registrations").select("*", { count: "exact", head: true }).eq("payment_status", "paid"),
    admin.from("registrations").select("guest_count, events(ticket_price)").eq("payment_status", "paid"),
  ]);

  // Total revenue = sum of (1 + guest_count) * ticket_price for paid registrations
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
      <h1 className="text-white text-2xl font-bold">Dashboard</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
          : "border-sn-gold/20 bg-sn-black"
      }`}
    >
      <p className="text-white/50 text-xs uppercase tracking-wider">{label}</p>
      <p className={`text-2xl font-bold ${accent ? "text-amber-400" : "text-white"}`}>
        {value}
      </p>
      {sub !== undefined && (
        <p className="text-white/40 text-xs">{sub}</p>
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
      className="rounded-xl border border-sn-gold/20 bg-sn-black p-5 hover:bg-white/5 transition-colors space-y-1"
    >
      <p className="text-white font-medium text-sm">{title} →</p>
      <p className="text-white/50 text-xs">{description}</p>
    </Link>
  );
}
