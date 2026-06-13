"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg":   "jpg",
  "image/png":    "png",
  "image/gif":    "gif",
  "image/webp":   "webp",
  "image/svg+xml": "svg",
};

/**
 * Returns a signed upload URL for the rich-text-images bucket.
 * The client uploads the file directly to Supabase Storage using this URL —
 * the file never passes through Next.js, avoiding server action body size limits.
 * The returned publicUrl uses the CDN prefix (NEXT_PUBLIC_CDN_URL) so images
 * are served via the /cdn rewrite on the app's own domain.
 */
export async function getRichTextImageUploadUrl(
  ext: string,
  mimeType: string,
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

  if (!ALLOWED_TYPES[mimeType]) return { error: "Unsupported file type." };

  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from("rich-text-images")
    .createSignedUploadUrl(path);

  if (error !== null || data === null) {
    console.error("[getRichTextImageUploadUrl] Signed URL error:", error);
    return { error: "Failed to generate upload URL. Please try again." };
  }

  const cdnBase = process.env.NEXT_PUBLIC_CDN_URL ?? "";
  const publicUrl = `${cdnBase}/rich-text-images/${path}`;

  return { uploadUrl: data.signedUrl, token: data.token, publicUrl };
}
