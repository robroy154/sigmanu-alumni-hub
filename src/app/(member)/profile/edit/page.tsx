import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ProfileEditForm } from "@/components/profile/ProfileEditForm";
import { AvatarUpload } from "@/components/profile/AvatarUpload";
import { SetPinForm } from "@/components/profile/SetPinForm";
import { BigBrotherSelector } from "@/components/profile/BigBrotherSelector";
import type { ProfileUpdateInput } from "@/lib/profile/schemas";

export const metadata: Metadata = { title: "Edit Profile" };

export default async function ProfileEditPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user === null) redirect("/login");

  const [{ data: member }, { data: allMembers }] = await Promise.all([
    supabase
      .from("members")
      .select(
        "first_name, last_name, nickname, pledge_class, pin_number, phone, email, city, state, linkedin_url, profile_photo_url, big_id, street_address, zip, country, birthday, show_address, show_birthday, show_phone, newsletter_opt_out"
      )
      .eq("id", user.id)
      .single(),
    // All approved members + stubs except self — for the Big Brother selector.
    // Uses admin client so stub rows (restricted by RLS) are visible.
    createAdminClient()
      .from("members")
      .select("id, first_name, last_name, pledge_class, pin_number, status")
      .in("status", ["member", "admin", "stub"])
      .neq("id", user.id)
      .order("last_name"),
  ]);

  if (member === null) redirect("/login");

  // Resolve signed URL for current photo preview.
  let photoUrl: string | null = null;
  if (member.profile_photo_url !== null && member.profile_photo_url !== "") {
    const { data: signed } = await supabase.storage
      .from("profile-photos")
      .createSignedUrl(member.profile_photo_url, 3600);
    photoUrl = signed?.signedUrl ?? null;
  }

  // Resolve current Big's name for display in the selector.
  let currentBigName: string | null = null;
  if (member.big_id !== null) {
    const bigMember = (allMembers ?? []).find((m) => m.id === member.big_id);
    if (bigMember !== undefined) {
      currentBigName = bigMember.status === "stub"
        ? `${bigMember.first_name} ${bigMember.last_name} (unclaimed)`
        : `${bigMember.first_name} ${bigMember.last_name}`;
    }
  }

  const defaultValues: ProfileUpdateInput = {
    first_name:     member.first_name,
    last_name:      member.last_name,
    nickname:       member.nickname ?? undefined,
    pledge_class:   member.pledge_class ?? undefined,
    phone:          member.phone ?? undefined,
    city:           member.city ?? undefined,
    state:          member.state ?? undefined,
    linkedin_url:   member.linkedin_url ?? undefined,
    street_address: member.street_address ?? undefined,
    zip:            member.zip ?? undefined,
    country:        member.country ?? undefined,
    birthday:       member.birthday ?? undefined,
    show_address:        member.show_address,
    show_birthday:       member.show_birthday,
    show_phone:          member.show_phone,
    newsletter_opt_out:  member.newsletter_opt_out,
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
      <div className="bg-sn-black rounded-xl border border-sn-gold/20 p-6 flex flex-col items-center gap-2">
        <p className="text-white/70 text-xs font-semibold uppercase tracking-wider self-start mb-2">
          Profile Photo
        </p>
        <AvatarUpload userId={user.id} currentPhotoUrl={photoUrl} />
      </div>

      {/* Pin number — only shown when not yet set */}
      {(member.pin_number === null || member.pin_number === "") && (
        <div className="bg-sn-black rounded-xl border border-sn-gold/20 p-6 space-y-3">
          <p className="text-white/70 text-xs font-semibold uppercase tracking-wider">
            Pin Number
          </p>
          <SetPinForm />
        </div>
      )}

      {/* Big Brother */}
      <div className="bg-sn-black rounded-xl border border-sn-gold/20 p-6 space-y-3">
        <div className="space-y-0.5">
          <p className="text-white/70 text-xs font-semibold uppercase tracking-wider">
            Big Brother
          </p>
          <p className="text-white/40 text-xs">
            Select the member who is your Big. Your Littles are set automatically when they choose you.
          </p>
        </div>
        <BigBrotherSelector
          currentBigId={member.big_id}
          currentBigName={currentBigName}
          allMembers={allMembers ?? []}
        />
      </div>

      {/* Profile fields */}
      <div className="bg-sn-black rounded-xl border border-sn-gold/20 p-6 space-y-4">
        <p className="text-white/70 text-xs font-semibold uppercase tracking-wider">
          Profile Details
        </p>
        <ProfileEditForm defaultValues={defaultValues} />
      </div>
    </div>
  );
}
