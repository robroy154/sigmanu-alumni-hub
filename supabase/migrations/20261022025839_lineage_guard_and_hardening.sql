-- APPLIED to production 2026-10-21 (version 20261022025839). Verified: self-reference and a
-- two-generation loop are both rejected; every existing big/little link re-validates cleanly.
--
-- Lineage guard: no member can be their own big, and no big_id change may create a cycle.
-- Covers every write path (session client, admin client, imports). SECURITY DEFINER so the
-- ancestor walk sees all rows regardless of the caller's RLS visibility. handle_new_user's
-- stub claim never sets big_id on the claimed row, and re-pointing littles to the new id
-- cannot form a loop, so stub claiming is unaffected.
CREATE OR REPLACE FUNCTION public.prevent_big_id_cycle()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.big_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.big_id = NEW.id THEN
    RAISE EXCEPTION 'Invalid lineage: a member cannot be their own big brother.'
      USING ERRCODE = 'check_violation';
  END IF;

  IF EXISTS (
    WITH RECURSIVE ancestors(member_id, depth) AS (
      SELECT m.big_id, 1 FROM public.members m WHERE m.id = NEW.big_id
      UNION ALL
      SELECT m.big_id, a.depth + 1
      FROM public.members m
      JOIN ancestors a ON m.id = a.member_id
      WHERE a.member_id IS NOT NULL AND a.depth < 200
    )
    SELECT 1 FROM ancestors WHERE member_id = NEW.id
  ) THEN
    RAISE EXCEPTION 'Invalid lineage: that big brother is already in this member''s line of littles.'
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER members_prevent_big_id_cycle
  BEFORE INSERT OR UPDATE OF big_id ON public.members
  FOR EACH ROW EXECUTE FUNCTION public.prevent_big_id_cycle();

-- Trigger/event-trigger functions and server-only RPCs are not part of the public API.
-- Triggers do not need EXECUTE at fire time; the RPCs are only called via the service role
-- (stub-search.ts, auth/callback/route.ts, import-actions.ts all use createAdminClient).
-- current_member_status() is intentionally untouched: RLS policies call it as the caller.
REVOKE EXECUTE ON FUNCTION public.prevent_big_id_cycle()    FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user()         FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_auth_user_delete() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at()          FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable()         FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.search_stubs(text, text, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.find_member_by_name(text)      FROM PUBLIC, anon, authenticated;

-- Covering indexes for foreign keys flagged by the performance advisor.
CREATE INDEX IF NOT EXISTS announcements_created_by_idx             ON public.announcements (created_by);
CREATE INDEX IF NOT EXISTS badges_assigned_by_idx                   ON public.badges (assigned_by);
CREATE INDEX IF NOT EXISTS dismissed_announcements_announcement_idx ON public.dismissed_announcements (announcement_id);
CREATE INDEX IF NOT EXISTS event_field_responses_field_id_idx       ON public.event_field_responses (field_id);
CREATE INDEX IF NOT EXISTS members_referred_by_idx                  ON public.members (referred_by);
CREATE INDEX IF NOT EXISTS waitlist_member_id_idx                   ON public.waitlist (member_id);
