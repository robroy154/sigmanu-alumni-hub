-- Phase 21 fix: handle_new_user trigger
-- Uses UPDATE stub row in place instead of INSERT + DELETE
-- Eliminates unique constraint violations on pin_number and other constrained columns
-- Empty string birthday guard added to SignupForm.tsx separately

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  stub_id uuid;
  stub_row public.members%ROWTYPE;
BEGIN
  BEGIN
    stub_id := (new.raw_user_meta_data->>'stub_id')::uuid;

    IF stub_id IS NOT NULL THEN
      SELECT * INTO stub_row FROM public.members
      WHERE id = stub_id AND status = 'stub';

      IF FOUND THEN
        UPDATE public.members SET
          id         = new.id,
          email      = new.email,
          first_name = COALESCE(NULLIF(stub_row.first_name, ''),
                                new.raw_user_meta_data->>'first_name', ''),
          last_name  = COALESCE(NULLIF(stub_row.last_name, ''),
                                new.raw_user_meta_data->>'last_name', ''),
          status     = 'pending',
          updated_at = now()
        WHERE id = stub_id;

        RETURN new;
      END IF;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user stub claim failed: % %', SQLERRM, SQLSTATE;
  END;

  INSERT INTO public.members (id, email, first_name, last_name, status)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'first_name', ''),
    COALESCE(new.raw_user_meta_data->>'last_name', ''),
    'pending'
  );
  RETURN new;

EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'handle_new_user normal insert failed: %', SQLERRM;
  RAISE;
END;
$$;
