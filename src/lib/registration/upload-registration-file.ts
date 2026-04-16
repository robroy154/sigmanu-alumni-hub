"use server";

import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Uploads a base64-encoded file to the private registration-files bucket.
 * Returns the storage path (not a public URL — bucket is private).
 * Path: registration-files/pending/[tempId]/[fieldId]/[filename]
 */
export async function uploadRegistrationFile(
  base64Data: string,
  mimeType:   string,
  tempId:     string,
  fieldId:    string,
  filename:   string
): Promise<{ error: string } | { path: string }> {
  const base64 = base64Data.replace(/^data:[^;]+;base64,/, "");
  const buffer = Buffer.from(base64, "base64");

  // Sanitize filename
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `pending/${tempId}/${fieldId}/${safe}`;

  const admin = createAdminClient();
  const { error } = await admin.storage
    .from("registration-files")
    .upload(path, buffer, { contentType: mimeType, upsert: true });

  if (error !== null) {
    return { error: "File upload failed." };
  }

  return { path };
}
