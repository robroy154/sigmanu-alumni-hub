import Link from "next/link";
import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { InlineMergeButton } from "@/components/admin/InlineMergeButton";
import { Upload } from "lucide-react";

export const metadata: Metadata = { title: "Stubs — Admin" };

export default async function AdminStubsPage() {
  const admin = createAdminClient();

  const [{ data: stubs }, { data: realMembers }] = await Promise.all([
    admin
      .from("members")
      .select("id, first_name, last_name, pledge_class, pin_number")
      .eq("status", "stub")
      .order("last_name"),
    admin
      .from("members")
      .select("id, first_name, last_name, pledge_class, pin_number, status")
      .in("status", ["member", "admin", "pending"])
      .order("last_name"),
  ]);

  const stubRows   = stubs ?? [];
  const memberRows = realMembers ?? [];

  // Group stubs by whether they have a last_name match among real members
  type RealMember = (typeof memberRows)[number];
  const matches:   { stub: (typeof stubRows)[number]; members: RealMember[] }[] = [];
  const noMatches: (typeof stubRows)[number][] = [];

  for (const stub of stubRows) {
    const stubLast = stub.last_name.toLowerCase();
    const found = memberRows.filter((m) => m.last_name.toLowerCase() === stubLast);
    if (found.length > 0) {
      matches.push({ stub, members: found });
    } else {
      noMatches.push(stub);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-sn-off-white text-2xl font-bold">Stubs</h1>
          <p className="text-sn-gray-text text-sm mt-1">
            Unclaimed alumni records. Match and merge stubs with real member accounts.
          </p>
        </div>
        <Link
          href="/admin/stubs/import"
          className="flex items-center gap-2 h-8 px-4 rounded-lg bg-sn-gold/10 border border-sn-gold/30 text-sn-gold text-sm hover:bg-sn-gold/20 transition-colors"
        >
          <Upload className="w-4 h-4" />
          Import CSV
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Total Stubs"      value={stubRows.length}   color="text-sn-off-white" />
        <StatCard label="Probable Matches" value={matches.length}    color="text-sn-gold" />
        <StatCard label="No Match"         value={noMatches.length}  color="text-sn-gray-medium" />
      </div>

      {/* Probable matches */}
      {matches.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sn-off-white font-semibold">Probable Matches</h2>
          <p className="text-sn-gray-text text-xs">
            Stubs sharing a last name with an active member. Review and merge if they are the same person.
          </p>
          <div className="bg-sn-surface rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-sn-gray-text text-xs uppercase tracking-wider">
                    <th className="px-4 py-3 text-left font-medium">Stub</th>
                    <th className="px-4 py-3 text-left font-medium hidden md:table-cell">Pledge Class</th>
                    <th className="px-4 py-3 text-left font-medium hidden md:table-cell">Badge #</th>
                    <th className="px-4 py-3 text-left font-medium">Probable Match</th>
                    <th className="px-4 py-3 text-left font-medium hidden md:table-cell">Status</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {matches.flatMap(({ stub, members }) =>
                    members.map((member, i) => (
                      <tr key={`${stub.id}-${member.id}`} className="hover:bg-white/5 transition-colors">
                        {i === 0 ? (
                          <>
                            <td
                              className="px-4 py-3 text-sn-off-white font-medium align-top"
                              rowSpan={members.length > 1 ? members.length : undefined}
                            >
                              <Link
                                href={`/admin/members/${stub.id}`}
                                className="hover:text-sn-gold transition-colors"
                              >
                                {stub.first_name} {stub.last_name}
                              </Link>
                            </td>
                            <td
                              className="px-4 py-3 text-sn-gray-text hidden md:table-cell align-top"
                              rowSpan={members.length > 1 ? members.length : undefined}
                            >
                              {stub.pledge_class ?? <span className="text-white/30">—</span>}
                            </td>
                            <td
                              className="px-4 py-3 text-sn-gray-text font-mono text-xs hidden md:table-cell align-top"
                              rowSpan={members.length > 1 ? members.length : undefined}
                            >
                              {stub.pin_number !== null && stub.pin_number !== undefined
                                ? `ΜΞ ${String(stub.pin_number).padStart(3, "0")}`
                                : <span className="text-white/30">—</span>}
                            </td>
                          </>
                        ) : null}
                        <td className="px-4 py-3">
                          <Link
                            href={`/admin/members/${member.id}`}
                            className="text-sn-off-white hover:text-sn-gold transition-colors"
                          >
                            {member.first_name} {member.last_name}
                          </Link>
                          {member.pledge_class !== null && member.pledge_class !== undefined && (
                            <p className="text-sn-gray-medium text-xs">{member.pledge_class}</p>
                          )}
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <StatusBadge status={member.status} />
                        </td>
                        <td className="px-4 py-3">
                          <InlineMergeButton
                            realMemberId={member.id}
                            stubId={stub.id}
                            stubName={`${stub.first_name} ${stub.last_name}`}
                            memberName={`${member.first_name} ${member.last_name}`}
                          />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* No matches */}
      {noMatches.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sn-off-white font-semibold">No Match Found</h2>
          <p className="text-sn-gray-text text-xs">
            No member shares a last name with these stubs. They may have signed up under a different name, or haven&apos;t joined yet.
          </p>
          <div className="bg-sn-surface rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-sn-gray-text text-xs uppercase tracking-wider">
                    <th className="px-4 py-3 text-left font-medium">Name</th>
                    <th className="px-4 py-3 text-left font-medium hidden md:table-cell">Pledge Class</th>
                    <th className="px-4 py-3 text-left font-medium hidden md:table-cell">Badge #</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {noMatches.map((stub) => (
                    <tr key={stub.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3 text-sn-off-white font-medium">
                        {stub.first_name} {stub.last_name}
                      </td>
                      <td className="px-4 py-3 text-sn-gray-text hidden md:table-cell">
                        {stub.pledge_class ?? <span className="text-white/30">—</span>}
                      </td>
                      <td className="px-4 py-3 text-sn-gray-text font-mono text-xs hidden md:table-cell">
                        {stub.pin_number !== null && stub.pin_number !== undefined
                          ? `ΜΞ ${String(stub.pin_number).padStart(3, "0")}`
                          : <span className="text-white/30">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/members/${stub.id}`}
                          className="text-sn-gray-text hover:text-sn-gold text-xs transition-colors"
                        >
                          View →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {stubRows.length === 0 && (
        <div className="bg-sn-surface rounded-xl border border-sn-gold/20 p-12 text-center">
          <p className="text-sn-gray-text text-sm">No unclaimed stubs in the system.</p>
          <Link
            href="/admin/stubs/import"
            className="inline-flex items-center gap-2 mt-4 text-sn-gold hover:text-sn-gold-light text-sm transition-colors"
          >
            <Upload className="w-4 h-4" />
            Import alumni CSV →
          </Link>
        </div>
      )}
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
