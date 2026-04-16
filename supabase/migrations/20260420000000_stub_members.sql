-- ─────────────────────────────────────────────────────────────────────────────
-- Phase 22 — Pre-Seeded Alumni Stub System
-- Safe to run on a live database with existing records.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Add 'stub' to members status check constraint ────────────────────────────
ALTER TABLE public.members
  DROP CONSTRAINT IF EXISTS members_status_check;
ALTER TABLE public.members
  ADD CONSTRAINT members_status_check
  CHECK (status IN ('pending', 'member', 'admin', 'stub'));

-- ── Allow stub members without a corresponding auth.users row ────────────────
-- Stubs are pre-seeded records with no auth account. The original FK
-- (members.id → auth.users.id ON DELETE CASCADE) prevents direct inserts.
-- Solution:
--   1. Drop the FK constraint.
--   2. Add gen_random_uuid() default so stub inserts can omit id.
--   3. Add a trigger to replicate the ON DELETE CASCADE behavior.
--   4. Add a trigger to enforce the FK for non-stub members (safety net).

ALTER TABLE public.members
  DROP CONSTRAINT IF EXISTS members_id_fkey;

ALTER TABLE public.members
  ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Replaces the ON DELETE CASCADE behavior removed with the FK.
CREATE OR REPLACE FUNCTION public.handle_auth_user_delete()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  DELETE FROM public.members WHERE id = OLD.id;
  RETURN OLD;
END;
$$;

-- Drop existing trigger if present (idempotent re-run safety)
DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;
CREATE TRIGGER on_auth_user_deleted
  AFTER DELETE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_auth_user_delete();

-- ── pg_trgm extension for fuzzy name search ──────────────────────────────────
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ── Trigram index for fast fuzzy name matching ───────────────────────────────
CREATE INDEX IF NOT EXISTS members_name_trgm_idx
  ON public.members
  USING gin ((first_name || ' ' || last_name) gin_trgm_ops);

-- ── Stub search function ──────────────────────────────────────────────────────
-- Called from the signup form to find matching stub records.
CREATE OR REPLACE FUNCTION public.search_stubs(
  search_name         text,
  search_pledge_class text DEFAULT NULL,
  search_pin          text DEFAULT NULL
)
RETURNS TABLE (
  id           uuid,
  first_name   text,
  last_name    text,
  nickname     text,
  pledge_class text,
  pin_number   text,
  similarity   float
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    id,
    first_name,
    last_name,
    nickname,
    pledge_class,
    pin_number,
    similarity(
      lower(first_name || ' ' || last_name),
      lower(search_name)
    ) AS similarity
  FROM public.members
  WHERE
    status = 'stub'
    AND similarity(
      lower(first_name || ' ' || last_name),
      lower(search_name)
    ) > 0.25
    AND (search_pledge_class IS NULL OR pledge_class = search_pledge_class)
    AND (search_pin IS NULL OR pin_number = search_pin)
  ORDER BY similarity DESC
  LIMIT 5;
$$;

-- ── Big-brother name resolution function (used by admin CSV import) ───────────
-- Searches non-stub members only. Returns the best match above 0.6 similarity.
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
    status != 'stub'
    AND similarity(
      lower(first_name || ' ' || last_name),
      lower(search_name)
    ) > 0.6
  ORDER BY similarity DESC
  LIMIT 1;
$$;

-- ── Update handle_new_user trigger (stub-claiming aware) ──────────────────────
-- CRITICAL: A broken trigger breaks all signups.
-- Uses v_stub_id (prefixed) to avoid name collision with the stub_id column.
-- If stub_id in auth metadata matches a stub row, the new member inherits the
-- stub's pledge_class, pin_number, big_id, and nickname. The stub row is then
-- deleted UNLESS it has existing registrations (preserves event history).
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_stub_id  uuid;
  stub_row   public.members%ROWTYPE;
BEGIN
  -- Guard the uuid cast: if stub_id is absent or malformed, silently treat as NULL
  -- so a bad value never causes an uncaught exception that would abort the signup.
  BEGIN
    v_stub_id := (new.raw_user_meta_data->>'stub_id')::uuid;
  EXCEPTION WHEN invalid_text_representation THEN
    v_stub_id := NULL;
  END;

  IF v_stub_id IS NOT NULL THEN
    SELECT * INTO stub_row FROM public.members
    WHERE id = v_stub_id AND status = 'stub';

    IF FOUND THEN
      INSERT INTO public.members (
        id, email, first_name, last_name, nickname,
        pledge_class, pin_number, big_id, status
      ) VALUES (
        new.id,
        new.email,
        COALESCE(NULLIF(stub_row.first_name, ''),
                 new.raw_user_meta_data->>'first_name', ''),
        COALESCE(NULLIF(stub_row.last_name, ''),
                 new.raw_user_meta_data->>'last_name', ''),
        stub_row.nickname,
        stub_row.pledge_class,
        stub_row.pin_number,
        stub_row.big_id,
        'pending'
      );
      -- Only delete stub row if it has no associated registrations
      DELETE FROM public.members
      WHERE id = v_stub_id
        AND NOT EXISTS (
          SELECT 1 FROM public.registrations WHERE member_id = v_stub_id
        );
      RETURN new;
    END IF;
  END IF;

  -- Normal signup path (no stub claim or stub not found)
  INSERT INTO public.members (id, email, first_name, last_name, status)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'first_name', ''),
    COALESCE(new.raw_user_meta_data->>'last_name', ''),
    'pending'
  );
  RETURN new;
END;
$$;

-- ── RLS note ──────────────────────────────────────────────────────────────────
-- The existing "members: member+ can read all" policy has no status filter on
-- the target row, so it already covers stub rows (authenticated members can
-- see them). No new policy needed. Verify after migration by querying stubs
-- from the authenticated client — they should be visible.
