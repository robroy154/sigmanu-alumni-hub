import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { CancelReferralButton } from "@/components/admin/CancelReferralButton";
import { DeleteReferralButton } from "@/components/admin/DeleteReferralButton";
import { ResendReferralButton } from "@/components/admin/ResendReferralButton";

export const metadata: Metadata = { title: "Referrals — Admin" };

interface Props {
  searchParams: Promise<{ q?: string }>;
}

export default async function AdminReferralsPage({ searchParams }: Props) {
  const { q: query } = await searchParams;
  const admin = createAdminClient();

  // Fetch all referrals, join referrer name via a second query.
  const { data: referrals } = await admin
    .from("referrals")
    .select("id, referred_by, first_name, last_name, email, status, created_at, expires_at, completed_at")
    .order("created_at", { ascending: false });

  // Collect unique referrer IDs and fetch their names in one query.
  const referrerIds = [...new Set((referrals ?? []).map((r) => r.referred_by))];
  const { data: referrerMembers } = referrerIds.length > 0
    ? await admin
        .from("members")
        .select("id, first_name, last_name")
        .in("id", referrerIds)
    : { data: [] };

  const referrerMap = new Map(
    (referrerMembers ?? []).map((m) => [m.id, `${m.first_name} ${m.last_name}`])
  );

  const allRows = referrals ?? [];
  const rows =
    query !== undefined && query.trim() !== ""
      ? allRows.filter((r) => {
          const q = query.toLowerCase();
          return (
            r.first_name.toLowerCase().includes(q) ||
            r.last_name.toLowerCase().includes(q) ||
            r.email.toLowerCase().includes(q)
          );
        })
      : allRows;

  const counts = {
    pending:   allRows.filter((r) => r.status === "pending").length,
    completed: allRows.filter((r) => r.status === "completed").length,
    expired:   allRows.filter((r) => r.status === "expired").length,
  };
  const conversionRate =
    counts.completed + counts.expired > 0
      ? Math.round((counts.completed / (counts.completed + counts.expired)) * 100)
      : null;

  return (
    <div className="space-y-6">
      <h1 className="text-sn-off-white text-2xl font-bold">Referrals</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Pending"   value={counts.pending}   color="text-sn-gold" />
        <StatCard label="Joined"    value={counts.completed} color="text-green-400" />
        <StatCard label="Expired"   value={counts.expired}   color="text-sn-gray-medium" />
        <div className="bg-sn-surface rounded-xl border border-sn-gold/20 px-5 py-4">
          <p className="text-sn-gray-text text-xs uppercase tracking-wider">Conversion Rate</p>
          <p className="text-sn-off-white text-3xl font-bold mt-1">
            {conversionRate !== null ? `${conversionRate}%` : "—"}
          </p>
          <p className="text-sn-gray-medium text-xs mt-0.5">of sent invites joined</p>
        </div>
      </div>

      {/* Search */}
      <form method="GET" className="flex gap-2 items-center">
        <input
          name="q"
          defaultValue={query}
          placeholder="Search name or email…"
          className="h-8 rounded-lg border border-white/20 bg-white/10 px-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-sn-gold w-64"
        />
        <button
          type="submit"
          className="h-8 px-3 rounded-lg border border-white/20 text-white/70 hover:bg-white/10 text-sm transition-colors"
        >
          Filter
        </button>
        {query !== undefined && query !== "" && (
          <a href="/admin/referrals" className="text-white/40 hover:text-white text-sm transition-colors">
            Clear
          </a>
        )}
      </form>
      {query !== undefined && query !== "" && (
        <p className="text-sn-gray-text text-xs">
          Showing <span className="text-sn-off-white font-medium">{rows.length}</span> of {allRows.length} referrals
        </p>
      )}

      {/* Table */}
      <div className="bg-sn-surface rounded-xl overflow-hidden">
        {rows.length === 0 ? (
          <p className="text-sn-gray-medium text-sm text-center py-12">No referrals yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-sn-gray-text text-xs uppercase tracking-wider">
                  <th className="px-4 py-3 text-left font-medium">Invitee</th>
                  <th className="px-4 py-3 text-left font-medium">Email</th>
                  <th className="px-4 py-3 text-left font-medium">Referred by</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">Sent</th>
                  <th className="px-4 py-3 text-left font-medium">Expires</th>
                  <th className="px-4 py-3 text-left font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {rows.map((r) => {
                  const isExpiredByDate = r.status === "pending" && new Date(r.expires_at) < new Date();
                  const effectiveStatus = isExpiredByDate ? "expired" : r.status;
                  return (
                    <tr key={r.id} className="hover:bg-white/3 transition-colors">
                      <td className="px-4 py-3 text-sn-off-white font-medium">
                        {r.first_name} {r.last_name}
                      </td>
                      <td className="px-4 py-3 text-sn-gray-text">{r.email}</td>
                      <td className="px-4 py-3 text-sn-gray-text">
                        {referrerMap.get(r.referred_by) ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={effectiveStatus} />
                      </td>
                      <td className="px-4 py-3 text-sn-gray-text text-xs">
                        {new Date(r.created_at).toLocaleDateString("en-US", {
                          month: "short", day: "numeric", year: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-3 text-sn-gray-text text-xs">
                        {effectiveStatus === "completed"
                          ? r.completed_at !== null && r.completed_at !== undefined
                            ? `Joined ${new Date(r.completed_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
                            : "—"
                          : new Date(r.expires_at).toLocaleDateString("en-US", {
                              month: "short", day: "numeric", year: "numeric",
                            })}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {r.status === "pending" && !isExpiredByDate && (
                            <ResendReferralButton referralId={r.id} />
                          )}
                          {r.status === "pending" && !isExpiredByDate && (
                            <CancelReferralButton referralId={r.id} />
                          )}
                          {effectiveStatus !== "completed" && (
                            <DeleteReferralButton referralId={r.id} />
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-sn-surface rounded-xl border border-sn-gold/20 px-5 py-4">
      <p className="text-sn-gray-text text-xs uppercase tracking-wider">{label}</p>
      <p className={`${color} text-3xl font-bold mt-1`}>{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "completed") {
    return (
      <span className="inline-flex items-center rounded-full bg-green-400/10 border border-green-400/30 px-2 py-0.5 text-xs text-green-400">
        Joined
      </span>
    );
  }
  if (status === "expired") {
    return (
      <span className="inline-flex items-center rounded-full bg-white/5 border border-white/15 px-2 py-0.5 text-xs text-white/40">
        Expired
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-sn-gold/10 border border-sn-gold/30 px-2 py-0.5 text-xs text-sn-gold">
      Pending
    </span>
  );
}
