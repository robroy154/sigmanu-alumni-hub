import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { ProfileEditForm } from "@/components/profile/ProfileEditForm";
import { AvatarUpload } from "@/components/profile/AvatarUpload";
import { SetPinForm } from "@/components/profile/SetPinForm";
import type { ProfileUpdateInput } from "@/lib/profile/schemas";

export const metadata: Metadata = { title: "Edit Profile" };

export default async function ProfileEditPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user === null) redirect("/login");

  const { data: member } = await supabase
    .from("members")
    .select(
      "first_name, last_name, nickname, pledge_class, pin_number, phone, city, state, linkedin_url, profile_photo_url"
    )
    .eq("id", user.id)
    .single();

  if (member === null) redirect("/login");

  // Resolve signed URL for current photo preview.
  let photoUrl: string | null = null;
  if (member.profile_photo_url !== null && member.profile_photo_url !== "") {
    const { data: signed } = await supabase.storage
      .from("profile-photos")
      .createSignedUrl(member.profile_photo_url, 3600);
    photoUrl = signed?.signedUrl ?? null;
  }

  const defaultValues: ProfileUpdateInput = {
    first_name:   member.first_name,
    last_name:    member.last_name,
    nickname:     member.nickname ?? undefined,
    pledge_class: member.pledge_class ?? undefined,
    phone:        member.phone ?? undefined,
    city:         member.city ?? undefined,
    state:        member.state ?? undefined,
    linkedin_url: member.linkedin_url ?? undefined,
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <h1 className="text-white text-xl font-semibold">Edit Profile</h1>
        <Link
          href="/profile"
          className="text-white/50 hover:text-white text-sm transition-colors"
        >
          ← Back to profile
        </Link>
      </div>

      {/* Photo upload */}
      <div className="bg-sn-navy rounded-xl border border-sn-gold/20 p-6 flex flex-col items-center gap-2">
        <p className="text-white/70 text-xs font-semibold uppercase tracking-wider self-start mb-2">
          Profile Photo
        </p>
        <AvatarUpload userId={user.id} currentPhotoUrl={photoUrl} />
      </div>

      {/* Pin number — only shown when not yet set */}
      {(member.pin_number === null || member.pin_number === "") && (
        <div className="bg-sn-navy rounded-xl border border-sn-gold/20 p-6 space-y-3">
          <p className="text-white/70 text-xs font-semibold uppercase tracking-wider">
            Pin Number
          </p>
          <SetPinForm />
        </div>
      )}

      {/* Profile fields */}
      <div className="bg-sn-navy rounded-xl border border-sn-gold/20 p-6 space-y-4">
        <p className="text-white/70 text-xs font-semibold uppercase tracking-wider">
          Profile Details
        </p>
        <ProfileEditForm defaultValues={defaultValues} />
      </div>
    </div>
  );
}
