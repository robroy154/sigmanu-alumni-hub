import Link from "next/link";
import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { ApproveButton } from "@/components/admin/ApproveButton";
import { RejectMemberButton } from "@/components/admin/RejectMemberButton";
import { Users, Pencil } from "lucide-react";

export const metadata: Metadata = { title: "Members — Admin" };

interface Props {
  searchParams: Promise<{ status?: string; q?: string }>;
}

export default async function AdminMembersPage({ searchParams }: Props) {
  const { status: filterStatus, q: query } = await searchParams;
  const admin = createAdminClient();

  let dbQuery = admin
    .from("members")
    .select("id, first_name, last_name, email, pledge_class, status, created_at")
    .order("created_at", { ascending: false });

  if (filterStatus === "pending") {
    dbQuery = dbQuery.eq("status", "pending");
  } else if (filterStatus === "member") {
    dbQuery = dbQuery.eq("status", "member");
  } else if (filterStatus === "admin") {
    dbQuery = dbQuery.eq("status", "admin");
  }

  const { data: members } = await dbQuery;

  // Client-side-style search applied server-side
  const filtered =
    query !== undefined && query.trim() !== ""
      ? (members ?? []).filter((m) => {
          const q = query.toLowerCase();
          return (
            m.first_name.toLowerCase().includes(q) ||
            m.last_name.toLowerCase().includes(q) ||
            m.email.toLowerCase().includes(q)
          );
        })
      : (members ?? []);

  const pendingCount = (members ?? []).filter((m) => m.status === "pending").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-sn-off-white text-2xl font-bold">Members</h1>
        {pendingCount > 0 && (
          <span className="text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full px-3 py-1">
            {pendingCount} pending approval
          </span>
        )}
      </div>

      {/* Filters + search */}
      <form method="GET" className="flex flex-wrap gap-2 items-center">
        <input
          name="q"
          defaultValue={query}
          placeholder="Search name or email…"
          className="h-8 rounded-lg border border-white/20 bg-white/10 px-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-sn-gold w-64"
        />
        <div className="flex gap-1">
          {[
            { label: "All", value: "" },
            { label: "Pending", value: "pending" },
            { label: "Members", value: "member" },
            { label: "Admins", value: "admin" },
          ].map(({ label, value }) => (
            <button
              key={value}
              name="status"
              value={value}
              type="submit"
              className={`h-8 px-3 rounded-lg text-sm transition-colors ${
                (filterStatus ?? "") === value
                  ? "bg-sn-gold text-sn-black font-semibold"
                  : "border border-white/20 text-white/70 hover:bg-white/10"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </form>

      {/* Table */}
      <div className="rounded-sm border border-sn-gold/20 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-sn-surface border-b border-sn-gold/20">
              <th className="text-left px-4 py-3 text-sn-gray-text font-medium">Name</th>
              <th className="text-left px-4 py-3 text-sn-gray-text font-medium hidden md:table-cell">Email</th>
              <th className="text-left px-4 py-3 text-sn-gray-text font-medium hidden lg:table-cell">Pledge Class</th>
              <th className="text-left px-4 py-3 text-sn-gray-text font-medium">Status</th>
              <th className="text-left px-4 py-3 text-sn-gray-text font-medium hidden md:table-cell">Joined</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6}>
                  <div className="flex flex-col items-center gap-3 py-12 text-center">
                    <Users className="size-8 text-sn-gray-medium" />
                    <p className="text-sn-gray-text text-sm">No members found.</p>
                  </div>
                </td>
              </tr>
            )}
            {filtered.map((m, i) => (
              <tr
                key={m.id}
                className={`border-b border-white/5 ${
                  i % 2 === 0 ? "bg-sn-black/60" : "bg-sn-black/30"
                }`}
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/members/${m.id}`}
                    className="text-sn-off-white hover:text-sn-gold transition-colors font-medium"
                  >
                    {m.first_name} {m.last_name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-sn-gray-text hidden md:table-cell">
                  {m.email}
                </td>
                <td className="px-4 py-3 text-sn-gray-text hidden lg:table-cell">
                  {m.pledge_class ?? <span className="text-sn-gray-medium">—</span>}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={m.status} />
                </td>
                <td className="px-4 py-3 text-sn-gray-medium hidden md:table-cell">
                  {new Date(m.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day:   "numeric",
                    year:  "numeric",
                  })}
                </td>
                <td className="px-4 py-3 text-right">
                  {m.status === "pending" ? (
                    <div className="flex items-center justify-end gap-2">
                      <ApproveButton memberId={m.id} />
                      <RejectMemberButton
                        memberId={m.id}
                        memberName={`${m.first_name} ${m.last_name}`}
                      />
                    </div>
                  ) : (
                    <Link
                      href={`/admin/members/${m.id}`}
                      className="flex items-center gap-1 text-sn-gray-medium hover:text-sn-off-white text-xs transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />Edit
                    </Link>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    member:  "bg-green-500/20 text-green-400 border-green-500/30",
    admin:   "bg-sn-gold/20 text-sn-gold border-sn-gold/30",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs capitalize ${
        styles[status] ?? "bg-white/10 text-white/60 border-white/20"
      }`}
    >
      {status}
    </span>
  );
}
