-- ─────────────────────────────────────────────────────────────────────────────
-- Phase 22 patch — fix find_member_by_name for stub-aware big-brother resolution
-- Problem: original function excluded stubs (status != 'stub'), so when all big
-- brothers are also stubs (imported in the same CSV), none were ever found.
-- Fix: remove the status filter so all members are searched, and lower the
-- similarity threshold from 0.6 to 0.4 to handle shorter/unusual names.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.find_member_by_name(search_name text)
RETURNS TABLE (id uuid, similarity float)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    id,
    similarity(
      lower(first_name || ' ' || last_name),
      lower(search_name)
    ) AS similarity
  FROM public.members
  WHERE
    similarity(
      lower(first_name || ' ' || last_name),
      lower(search_name)
    ) > 0.4
  ORDER BY similarity DESC
  LIMIT 1;
$$;
