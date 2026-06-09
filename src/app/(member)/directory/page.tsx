import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  DirectoryClient,
  type DirectoryMember,
} from "@/components/directory/DirectoryClient";
import { PLEDGE_CLASSES } from "@/lib/utils/pledge-classes";

export const metadata: Metadata = { title: "Brother Directory" };

export default async function DirectoryPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user === null) redirect("/login");

  const { data: rows } = await supabase
    .from("members")
    .select(
      "id, first_name, last_name, nickname, pledge_class, pin_number, city, state, profile_photo_url"
    )
    .in("status", ["member", "admin"])
    .order("last_name");

  const members = rows ?? [];

  // Batch-resolve signed URLs for all members who have a photo path.
  // createSignedUrls issues one request regardless of how many paths are passed.
  const photoPaths = members
    .map((m) => m.profile_photo_url)
    .filter((p): p is string => p !== null && p !== "");

  const photoUrlMap: Record<string, string> = {};

  if (photoPaths.length > 0) {
    const { data: signed } = await supabase.storage
      .from("profile-photos")
      .createSignedUrls(photoPaths, 3600);

    signed?.forEach(({ path, signedUrl, error }) => {
      if (error === null && path !== null && path !== undefined && signedUrl !== null) {
        photoUrlMap[path] = signedUrl;
      }
    });
  }

  const directoryMembers: DirectoryMember[] = members.map((m) => ({
    id:           m.id,
    first_name:   m.first_name,
    last_name:    m.last_name,
    nickname:     m.nickname,
    pledge_class: m.pledge_class,
    pin_number:   m.pin_number,
    city:         m.city,
    state:        m.state,
    photo_url:    m.profile_photo_url !== null
      ? (photoUrlMap[m.profile_photo_url] ?? null)
      : null,
  }));

  // Build the pledge class filter list in canonical order (only classes present).
  const presentClasses = new Set(
    members.map((m) => m.pledge_class).filter((p): p is string => p !== null)
  );
  const pledgeClasses = PLEDGE_CLASSES.filter((pc) => presentClasses.has(pc));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-white text-2xl font-bold">Brother Directory</h1>
        <span className="text-white/40 text-sm">
          {directoryMembers.length} member{directoryMembers.length !== 1 ? "s" : ""}
        </span>
      </div>

      <DirectoryClient
        members={directoryMembers}
        pledgeClasses={pledgeClasses}
      />
    </div>
  );
}
