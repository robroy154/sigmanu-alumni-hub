import Link from "next/link";
import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { ClipboardList } from "lucide-react";
import { DeleteRegistrationButton } from "@/components/admin/DeleteRegistrationButton";

export const metadata: Metadata = { title: "Registrations — Admin" };

interface Props {
  searchParams: Promise<{ status?: string; q?: string; event_id?: string }>;
}

export default async function AdminRegistrationsPage({ searchParams }: Props) {
  const { status: filterStatus, q: query, event_id: eventIdFilter } = await searchParams;
  const admin = createAdminClient();

  const [{ data: registrations }, { data: events }] = await Promise.all([
    (() => {
      let dbQuery = admin
        .from("registrations")
        .select(
          "id, registrant_name, email, phone, tshirt_size, guest_count, dietary_restrictions, payment_status, stripe_payment_id, submitted_at, amount_paid, applied_price, event_id, events(title, ticket_price), registration_guests(guest_name)"
        )
        .order("submitted_at", { ascending: false });

      if (filterStatus === "paid" || filterStatus === "unpaid" || filterStatus === "refunded") {
        dbQuery = dbQuery.eq("payment_status", filterStatus);
      }
      if (eventIdFilter !== undefined && eventIdFilter !== "") {
        dbQuery = dbQuery.eq("event_id", eventIdFilter);
      }
      return dbQuery;
    })(),
    admin.from("events").select("id, title").order("event_date", { ascending: false }),
  ]);

  const allRows = registrations ?? [];
  const rows =
    query !== undefined && query.trim() !== ""
      ? allRows.filter((r) => {
          const q = query.toLowerCase();
          return (
            r.registrant_name.toLowerCase().includes(q) ||
            r.email.toLowerCase().includes(q)
          );
        })
      : allRows;

  // Totals (computed from the full filtered result set)
  const paidRows = rows.filter((r) => r.payment_status === "paid");
  const unpaidRows = rows.filter((r) => r.payment_status === "unpaid");
  const totalRevenue = paidRows.reduce((sum, r) => {
    if (r.amount_paid !== null && r.amount_paid !== undefined) {
      return sum + Number(r.amount_paid);
    }
    const price = Array.isArray(r.events)
      ? (r.events[0]?.ticket_price ?? 0)
      : ((r.events as { ticket_price: number } | null)?.ticket_price ?? 0);
    return sum + (1 + (r.guest_count ?? 0)) * price;
  }, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-sn-off-white text-2xl font-bold">Registrations</h1>
        <a
          href="/api/admin/registrations/export"
          className="inline-flex h-8 items-center rounded-sm border border-sn-gold/40 px-3 text-sm text-sn-gold hover:bg-sn-gold/10 transition-colors"
        >
          Export CSV
        </a>
      </div>

      {/* Summary strip */}
      <div className="flex flex-wrap gap-4 text-sm">
        <span className="text-sn-gray-text">
          <span className="text-sn-off-white font-medium">{rows.length}</span> total
        </span>
        <span className="text-sn-gray-text">
          <span className="text-green-400 font-medium">{paidRows.length}</span> paid
        </span>
        <span className="text-sn-gray-text">
          <span className="text-amber-400 font-medium">{unpaidRows.length}</span> unpaid
        </span>
        <span className="text-sn-gray-text">
          Revenue:{" "}
          <span className="text-sn-gold font-medium">
            ${totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </span>
        </span>
      </div>

      {/* Search + event filter */}
      <form method="GET" className="flex flex-wrap gap-2 items-center">
        {filterStatus !== undefined && filterStatus !== "" && (
          <input type="hidden" name="status" value={filterStatus} />
        )}
        {eventIdFilter !== undefined && eventIdFilter !== "" && (
          <input type="hidden" name="event_id" value={eventIdFilter} />
        )}
        <input
          name="q"
          defaultValue={query}
          placeholder="Search name or email…"
          className="h-8 rounded-lg border border-white/20 bg-white/10 px-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-sn-gold w-64"
        />
        <select
          name="event_id"
          defaultValue={eventIdFilter ?? ""}
          className="h-8 rounded-lg border border-white/20 bg-sn-surface px-3 text-sm text-white focus:outline-none focus:border-sn-gold"
        >
          <option value="">All events</option>
          {(events ?? []).map((e) => (
            <option key={e.id} value={e.id}>
              {e.title}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="h-8 px-3 rounded-lg border border-white/20 text-white/70 hover:bg-white/10 text-sm transition-colors"
        >
          Filter
        </button>
        {(query !== undefined && query !== "") || (eventIdFilter !== undefined && eventIdFilter !== "") ? (
          <Link
            href={filterStatus !== undefined && filterStatus !== "" ? `/admin/registrations?status=${filterStatus}` : "/admin/registrations"}
            className="h-8 px-3 rounded-lg text-white/40 hover:text-white text-sm transition-colors flex items-center"
          >
            Clear
          </Link>
        ) : null}
      </form>

      {/* Filter */}
      <div className="flex gap-1">
        {[
          { label: "All", value: "" },
          { label: "Paid", value: "paid" },
          { label: "Unpaid", value: "unpaid" },
          { label: "Refunded", value: "refunded" },
        ].map(({ label, value }) => {
          const params = new URLSearchParams();
          if (value !== "") params.set("status", value);
          if (query !== undefined && query !== "") params.set("q", query);
          if (eventIdFilter !== undefined && eventIdFilter !== "") params.set("event_id", eventIdFilter);
          const href = params.size > 0 ? `/admin/registrations?${params.toString()}` : "/admin/registrations";
          return (
            <Link
              key={value}
              href={href}
              className={`h-8 px-3 rounded-sm text-sm transition-colors flex items-center ${
                (filterStatus ?? "") === value
                  ? "bg-sn-gold text-sn-black font-semibold"
                  : "border border-white/20 text-white/70 hover:bg-white/10"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-sn-gold/20 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-sn-surface border-b border-sn-gold/20">
              <th className="text-left px-4 py-3 text-sn-gray-text font-medium">Name</th>
              <th className="text-left px-4 py-3 text-sn-gray-text font-medium hidden md:table-cell">Email</th>
              <th className="text-left px-4 py-3 text-sn-gray-text font-medium hidden lg:table-cell">Event</th>
              <th className="text-left px-4 py-3 text-sn-gray-text font-medium">Guests</th>
              <th className="text-left px-4 py-3 text-sn-gray-text font-medium">Amount</th>
              <th className="text-left px-4 py-3 text-sn-gray-text font-medium">Status</th>
              <th className="text-left px-4 py-3 text-sn-gray-text font-medium hidden md:table-cell">Submitted</th>
              <th className="px-4 py-3 text-sn-gray-text font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={8}>
                  <div className="flex flex-col items-center gap-3 py-12 text-center">
                    <ClipboardList className="size-8 text-sn-gray-medium" />
                    <p className="text-sn-gray-text text-sm">No registrations yet.</p>
                  </div>
                </td>
              </tr>
            )}
            {rows.map((r, i) => {
              const price = Array.isArray(r.events)
                ? (r.events[0]?.ticket_price ?? 0)
                : ((r.events as { ticket_price: number } | null)?.ticket_price ?? 0);
              const eventTitle = Array.isArray(r.events)
                ? (r.events[0]?.title ?? "—")
                : ((r.events as { title: string } | null)?.title ?? "—");
              const appliedPrice = r.applied_price !== null && r.applied_price !== undefined ? Number(r.applied_price) : price;
              const amount = r.amount_paid !== null && r.amount_paid !== undefined
                ? Number(r.amount_paid)
                : (1 + (r.guest_count ?? 0)) * appliedPrice;
              const amountIsEstimate = (r.amount_paid === null || r.amount_paid === undefined) && price > 0;
              const totalAttendees = 1 + (r.guest_count ?? 0);
              const guests = Array.isArray(r.registration_guests) ? r.registration_guests : [];

              return (
                <tr
                  key={r.id}
                  className={`border-b border-white/5 ${i % 2 === 0 ? "bg-sn-black/60" : "bg-sn-black/30"}`}
                >
                  <td className="px-4 py-3">
                    <div className="text-sn-off-white font-medium">{r.registrant_name}</div>
                    {guests.length > 0 && (
                      <div className="text-sn-gray-medium text-xs mt-0.5">
                        + {guests.map((g: { guest_name: string }) => g.guest_name).join(", ")}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sn-gray-text hidden md:table-cell">{r.email}</td>
                  <td className="px-4 py-3 text-sn-gray-text hidden lg:table-cell">{eventTitle}</td>
                  <td className="px-4 py-3 text-sn-gray-text">
                    {totalAttendees} attendee{totalAttendees !== 1 ? "s" : ""}
                    {(r.guest_count ?? 0) > 0 && (
                      <span className="text-sn-gray-medium text-xs block">
                        you + {r.guest_count} guest{(r.guest_count ?? 0) !== 1 ? "s" : ""}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sn-off-white">
                    {price > 0
                      ? `$${amount.toFixed(2)}${amountIsEstimate ? "*" : ""}`
                      : "Free"}
                  </td>
                  <td className="px-4 py-3">
                    <PaymentBadge status={r.payment_status} />
                  </td>
                  <td className="px-4 py-3 text-sn-gray-medium hidden md:table-cell">
                    {new Date(r.submitted_at).toLocaleDateString("en-US", {
                      month: "short",
                      day:   "numeric",
                      year:  "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        href={`/admin/registrations/${r.id}`}
                        className="text-sn-gold hover:text-sn-gold-light text-xs transition-colors"
                      >
                        View
                      </Link>
                      <DeleteRegistrationButton
                        registrationId={r.id}
                        registrantName={r.registrant_name}
                        eventTitle={eventTitle}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PaymentBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    paid:     "bg-green-500/20 text-green-400 border-green-500/30",
    unpaid:   "bg-amber-500/20 text-amber-400 border-amber-500/30",
    refunded: "bg-white/10 text-white/50 border-white/20",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs capitalize ${
        styles[status] ?? "bg-white/10 text-white/50 border-white/20"
      }`}
    >
      {status}
    </span>
  );
}
