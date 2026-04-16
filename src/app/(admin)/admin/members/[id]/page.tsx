import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminMemberEditForm } from "@/components/admin/AdminMemberEditForm";
import { DeleteMemberButton } from "@/components/admin/DeleteMemberButton";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const admin = createAdminClient();
  const { data } = await admin
    .from("members")
    .select("first_name, last_name")
    .eq("id", id)
    .single();
  if (data === null) return { title: "Member Not Found" };
  return { title: `${data.first_name} ${data.last_name} — Admin` };
}

export default async function AdminMemberDetailPage({ params }: Props) {
  const { id } = await params;
  const admin = createAdminClient();

  const [{ data: member }, { data: badges }, { data: allMembers }] =
    await Promise.all([
      admin
        .from("members")
        .select(
          "id, first_name, last_name, email, nickname, pledge_class, pin_number, phone, city, state, home_address, linkedin_url, status, big_id, created_at, referred_by"
        )
        .eq("id", id)
        .single(),
      admin
        .from("badges")
        .select("id, badge_type")
        .eq("member_id", id),
      admin
        .from("members")
        .select("id, first_name, last_name")
        .in("status", ["member", "admin"])
        .order("last_name"),
    ]);

  if (member === null) notFound();

  // Resolve big brother name for display — must include stubs because a stub's
  // big_id can point to another stub. allMembers only has member+admin (for the
  // dropdown); if big_id isn't found there, fetch it separately.
  let resolvedBigName: string | null = null;
  if (member.big_id !== null) {
    const bigInList = (allMembers ?? []).find((m) => m.id === member.big_id);
    if (bigInList !== undefined) {
      resolvedBigName = `${bigInList.first_name} ${bigInList.last_name}`;
    } else {
      const { data: bigMember } = await admin
        .from("members")
        .select("first_name, last_name, status")
        .eq("id", member.big_id)
        .single();
      if (bigMember !== null) {
        resolvedBigName =
          bigMember.status === "stub"
            ? `${bigMember.first_name} ${bigMember.last_name} (unclaimed stub)`
            : `${bigMember.first_name} ${bigMember.last_name}`;
      }
    }
  }

  // Resolve referrer name for display (admin-only field).
  let referrerName: string | null = null;
  let referrerId:   string | null = null;
  if (member.referred_by !== null && member.referred_by !== undefined) {
    referrerId = member.referred_by;
    const referrerMember = (allMembers ?? []).find((m) => m.id === member.referred_by);
    if (referrerMember !== undefined) {
      referrerName = `${referrerMember.first_name} ${referrerMember.last_name}`;
    } else {
      // May be a pending/deleted member not in allMembers — fetch directly.
      const { data: ref } = await admin
        .from("members")
        .select("first_name, last_name")
        .eq("id", member.referred_by)
        .single();
      if (ref !== null) referrerName = `${ref.first_name} ${ref.last_name}`;
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/members"
          className="text-sn-gray-text hover:text-sn-off-white text-sm transition-colors"
        >
          ← Members
        </Link>
        <h1 className="text-sn-off-white text-xl font-bold">
          {member.first_name} {member.last_name}
        </h1>
        <span className="text-sn-gray-medium text-sm">{member.email}</span>
      </div>

      <AdminMemberEditForm
        member={member}
        badges={badges ?? []}
        allMembers={allMembers ?? []}
        resolvedBigName={resolvedBigName}
        referrerName={referrerName}
        referrerId={referrerId}
      />

      {/* Danger zone */}
      <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-5 space-y-3">
        <p className="text-red-400 text-sm font-semibold uppercase tracking-wider">Danger Zone</p>
        <p className="text-white/50 text-sm">
          Permanently deletes this member&apos;s account and all associated data. This cannot be undone.
        </p>
        <DeleteMemberButton
          memberId={member.id}
          memberName={`${member.first_name} ${member.last_name}`}
        />
      </div>
    </div>
  );
}
