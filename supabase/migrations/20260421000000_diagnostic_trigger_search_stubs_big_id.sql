-- ── Add big_id to search_stubs return ────────────────────────────────────────
-- Required so the signup form can pre-populate the big brother dropdown when
-- the user claims a stub that already has a big_id linked.
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
  big_id       uuid,
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
    big_id,
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

-- ── Diagnostic handle_new_user trigger ───────────────────────────────────────
-- TEMPORARY: adds RAISE LOG statements to diagnose stub claim failures.
-- Check Supabase dashboard > Logs > Postgres logs for 'handle_new_user' entries
-- after a test signup where a stub is claimed.
-- TODO: remove RAISE LOG lines once stub claim is confirmed working.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  stub_id  uuid;
  stub_row public.members%ROWTYPE;
BEGIN
  BEGIN
    stub_id := (new.raw_user_meta_data->>'stub_id')::uuid;
    RAISE LOG 'handle_new_user: user=% stub_id=%', new.id, stub_id;

    IF stub_id IS NOT NULL THEN
      SELECT * INTO stub_row FROM public.members
      WHERE id = stub_id AND status = 'stub';

      RAISE LOG 'handle_new_user: stub found=%', FOUND;

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
        DELETE FROM public.members
        WHERE id = stub_id
          AND NOT EXISTS (
            SELECT 1 FROM public.registrations WHERE member_id = stub_id
          );
        RAISE LOG 'handle_new_user: stub claim complete for user=%', new.id;
        RETURN new;
      END IF;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'handle_new_user: stub claim FAILED: % %', SQLERRM, SQLSTATE;
  END;

  INSERT INTO public.members (id, email, first_name, last_name, status)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'first_name', ''),
    COALESCE(new.raw_user_meta_data->>'last_name', ''),
    'pending'
  );
  RAISE LOG 'handle_new_user: normal insert complete for user=%', new.id;
  RETURN new;

EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'handle_new_user normal insert failed: %', SQLERRM;
  RAISE;
END;
$$;
