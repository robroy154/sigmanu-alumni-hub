-- NOT YET APPLIED. Run in the Supabase SQL editor (the MCP confirmation prompt for DROP
-- statements could not be approved from the mobile session on 2026-10-21).
--
-- registration-files is written and read only through the service role
-- (uploadRegistrationFile uses createAdminClient). These two policies let any signed-in
-- user upload anything to the bucket and read every attendee's files, since they only
-- check bucket_id. The bucket was empty when this was written.
DROP POLICY IF EXISTS "storage: members can upload registration files"   ON storage.objects;
DROP POLICY IF EXISTS "storage: members can read own registration files" ON storage.objects;

-- Storage-level limits matching the server action's allowlist (5 MB).
UPDATE storage.buckets
SET file_size_limit = 5242880,
    allowed_mime_types = ARRAY[
      'application/pdf','image/jpeg','image/png','image/gif','image/webp','image/heic','image/heif',
      'text/plain','text/csv','application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ]
WHERE id = 'registration-files';
