import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminMemberEditForm } from "@/components/admin/AdminMemberEditForm";

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
          "id, first_name, last_name, email, nickname, pledge_class, pin_number, phone, city, state, home_address, linkedin_url, status, big_id, created_at"
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

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/members"
          className="text-white/50 hover:text-white text-sm transition-colors"
        >
          ← Members
        </Link>
        <h1 className="text-white text-xl font-bold">
          {member.first_name} {member.last_name}
        </h1>
        <span className="text-white/40 text-sm">{member.email}</span>
      </div>

      <AdminMemberEditForm
        member={member}
        badges={badges ?? []}
        allMembers={allMembers ?? []}
      />
    </div>
  );
}
