-- RLS policies for rich-text-images bucket (bucket created manually in dashboard)
-- Public bucket: anyone can read, only admins can upload/delete

CREATE POLICY "storage: public can read rich text images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'rich-text-images');

CREATE POLICY "storage: admin can upload rich text images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'rich-text-images'
    AND public.current_member_status() = 'admin'
  );

CREATE POLICY "storage: admin can delete rich text images"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'rich-text-images'
    AND public.current_member_status() = 'admin'
  );
