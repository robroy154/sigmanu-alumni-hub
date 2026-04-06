import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  FamilyTreeClient,
  type FamilyTreeMember,
} from "@/components/family-tree/FamilyTreeClient";

export const metadata: Metadata = { title: "Family Tree" };

export default async function FamilyTreePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user === null) redirect("/login");

  const { data: rows } = await supabase
    .from("members")
    .select(
      "id, first_name, last_name, nickname, pledge_class, profile_photo_url, big_id"
    )
    .in("status", ["member", "admin"])
    .order("last_name");

  const members = rows ?? [];

  // Batch-resolve signed URLs for all members who have a photo path.
  const photoPaths = members
    .map((m) => m.profile_photo_url)
    .filter((p): p is string => p !== null && p !== "");

  const photoUrlMap: Record<string, string> = {};

  if (photoPaths.length > 0) {
    const { data: signed } = await supabase.storage
      .from("profile-photos")
      .createSignedUrls(photoPaths, 3600);

    signed?.forEach(({ path, signedUrl, error }) => {
      if (error === null && path !== null && path !== undefined) {
        photoUrlMap[path] = signedUrl;
      }
    });
  }

  const treeMembers: FamilyTreeMember[] = members.map((m) => ({
    id:           m.id,
    first_name:   m.first_name,
    last_name:    m.last_name,
    nickname:     m.nickname,
    pledge_class: m.pledge_class,
    photo_url:    m.profile_photo_url !== null
      ? (photoUrlMap[m.profile_photo_url] ?? null)
      : null,
    big_id:       m.big_id,
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-white text-2xl font-bold">Chapter Family Tree</h1>
        <span className="text-white/40 text-sm">
          {treeMembers.length} member{treeMembers.length !== 1 ? "s" : ""}
        </span>
      </div>

      <FamilyTreeClient members={treeMembers} />
    </div>
  );
}
