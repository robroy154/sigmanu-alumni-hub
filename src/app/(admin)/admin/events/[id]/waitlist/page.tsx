import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { PromoteWaitlistButton } from "@/components/admin/PromoteWaitlistButton";
import { ChevronLeft } from "lucide-react";

export const metadata: Metadata = { title: "Admin · Waitlist" };

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AdminEventWaitlistPage({ params }: Props) {
  const { id } = await params;
  const admin = createAdminClient();

  const [{ data: event }, { data: waitlist }] = await Promise.all([
    admin
      .from("events")
      .select("id, title, slug")
      .eq("id", id)
      .single(),
    admin
      .from("waitlist")
      .select("id, member_id, guest_email, guest_name, created_at")
      .eq("event_id", id)
      .order("created_at", { ascending: true }),
  ]);

  if (event === null) notFound();

  // Resolve member names for rows with a member_id.
  const memberIds = (waitlist ?? [])
    .map((w) => w.member_id)
    .filter((id): id is string => id !== null);

  let memberMap = new Map<string, { first_name: string; last_name: string; email: string }>();
  if (memberIds.length > 0) {
    const { data: members } = await admin
      .from("members")
      .select("id, first_name, last_name, email")
      .in("id", memberIds);
    for (const m of members ?? []) {
      memberMap.set(m.id, { first_name: m.first_name, last_name: m.last_name, email: m.email });
    }
  }

  const rows = waitlist ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/events"
          className="inline-flex items-center gap-1 text-sn-gray-medium hover:text-sn-off-white text-sm transition-colors"
        >
          <ChevronLeft size={14} />Back to Events
        </Link>
      </div>

      <div>
        <h1 className="text-sn-off-white text-2xl font-bold">Waitlist</h1>
        <p className="text-sn-gray-medium text-sm mt-1">{event.title}</p>
      </div>

      <div className="bg-sn-surface rounded-xl overflow-hidden">
        {rows.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sn-gray-text text-sm">No one on the waitlist for this event.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left px-4 py-3 text-sn-gray-text font-medium">#</th>
                <th className="text-left px-4 py-3 text-sn-gray-text font-medium">Name / Email</th>
                <th className="text-left px-4 py-3 text-sn-gray-text font-medium hidden md:table-cell">Joined</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((entry, i) => {
                const member = entry.member_id !== null ? memberMap.get(entry.member_id) : undefined;
                const name = member !== undefined
                  ? `${member.first_name} ${member.last_name}`
                  : (entry.guest_name ?? "—");
                const email = member !== undefined ? member.email : (entry.guest_email ?? "—");
                const joined = new Date(entry.created_at).toLocaleDateString("en-US", {
                  month: "short", day: "numeric", year: "numeric",
                });

                return (
                  <tr key={entry.id} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 text-sn-gray-medium">{i + 1}</td>
                    <td className="px-4 py-3">
                      <p className="text-sn-off-white font-medium">{name}</p>
                      <p className="text-sn-gray-medium text-xs mt-0.5">{email}</p>
                    </td>
                    <td className="px-4 py-3 text-sn-gray-text hidden md:table-cell">{joined}</td>
                    <td className="px-4 py-3 text-right">
                      <PromoteWaitlistButton waitlistId={entry.id} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
