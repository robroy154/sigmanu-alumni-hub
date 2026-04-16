"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/**
 * Returns a signed upload URL for the event-banners bucket.
 * The client uploads the file directly to Supabase Storage using this URL —
 * the file never passes through Next.js, avoiding server action body size limits.
 */
export async function getEventImageUploadUrl(
  eventId: string,
  ext: string,
  forFlyer: boolean = false,
): Promise<{ error: string } | { uploadUrl: string; token: string; publicUrl: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user === null) return { error: "Not authenticated." };

  const { data: member } = await supabase
    .from("members")
    .select("status")
    .eq("id", user.id)
    .single();

  if (member?.status !== "admin") return { error: "Not authorized." };

  const suffix = forFlyer ? "flyer" : "banner";
  const path   = `${eventId}/${suffix}-${Date.now()}.${ext}`;

  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from("event-banners")
    .createSignedUploadUrl(path);

  if (error !== null || data === null) {
    console.error("[getEventImageUploadUrl] Signed URL error:", error);
    return { error: "Failed to generate upload URL. Please try again." };
  }

  const { data: { publicUrl } } = admin.storage
    .from("event-banners")
    .getPublicUrl(path);

  return { uploadUrl: data.signedUrl, token: data.token, publicUrl };
}
