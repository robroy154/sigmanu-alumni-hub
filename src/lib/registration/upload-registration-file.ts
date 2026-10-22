"use server";

import { createAdminClient } from "@/lib/supabase/admin";

// Public action (guests upload without an account), so everything it accepts is
// validated here: the target field must be a real file_upload field on an event
// that is open for registration, and only common document/image types are allowed.
const MAX_BYTES = 5 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/heic",
  "image/heif",
  "text/plain",
  "text/csv",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
const UUID_RE = new RegExp(`^${UUID}$`, "i");
// Forms pass a per-session UUID, optionally suffixed per attendee card.
const TEMP_ID_RE = new RegExp(`^${UUID}(-registrant|-guest-\\d{1,2})?$`, "i");

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
  if (!TEMP_ID_RE.test(tempId) || !UUID_RE.test(fieldId)) {
    return { error: "File upload failed." };
  }
  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    return { error: "That file type isn't supported. Upload a PDF, image, or Office document." };
  }

  const base64 = base64Data.replace(/^data:[^;]+;base64,/, "");
  const buffer = Buffer.from(base64, "base64");
  if (buffer.length === 0) {
    return { error: "File upload failed." };
  }
  if (buffer.length > MAX_BYTES) {
    return { error: "File is too large (max 5 MB)." };
  }

  const admin = createAdminClient();
  const { data: field } = await admin
    .from("event_fields")
    .select("field_type, events!inner(status, registration_open)")
    .eq("id", fieldId)
    .maybeSingle();

  const event = field?.events;
  if (
    field === null ||
    field.field_type !== "file_upload" ||
    event === undefined ||
    event.status !== "published" ||
    !event.registration_open
  ) {
    return { error: "File upload failed." };
  }

  // Sanitize filename; keep the extension visible but cap the length.
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-100) || "upload";
  const path = `pending/${tempId}/${fieldId}/${safe}`;

  const { error } = await admin.storage
    .from("registration-files")
    // upsert stays on so re-picking a file with the same name works; the path's
    // per-session UUID is what keeps one attendee from overwriting another's upload.
    .upload(path, buffer, { contentType: mimeType, upsert: true });

  if (error !== null) {
    return { error: "File upload failed." };
  }

  return { path };
}
