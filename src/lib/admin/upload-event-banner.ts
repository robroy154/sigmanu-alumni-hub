"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/**
 * Uploads a base64-encoded image to the event-banners bucket.
 * Returns the public URL on success.
 * Only admins can call this action.
 */
export async function uploadEventBanner(
  base64Data: string,
  mimeType: string,
  eventId: string,
  ext: string
): Promise<{ error: string } | { url: string }> {
  // Auth check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user === null) return { error: "Not authenticated." };

  const { data: member } = await supabase
    .from("members")
    .select("status")
    .eq("id", user.id)
    .single();

  if (member?.status !== "admin") return { error: "Not authorized." };

  // Decode base64
  const base64 = base64Data.replace(/^data:[^;]+;base64,/, "");
  const buffer = Buffer.from(base64, "base64");

  const path = `${eventId}/banner-${Date.now()}.${ext}`;

  const admin = createAdminClient();
  const { error: uploadError } = await admin.storage
    .from("event-banners")
    .upload(path, buffer, { contentType: mimeType });

  if (uploadError !== null) {
    console.error("[uploadEventBanner] Storage upload error:", uploadError);
    return { error: `Upload failed: ${uploadError.message}` };
  }

  const { data: { publicUrl } } = admin.storage
    .from("event-banners")
    .getPublicUrl(path);

  return { url: publicUrl };
}
