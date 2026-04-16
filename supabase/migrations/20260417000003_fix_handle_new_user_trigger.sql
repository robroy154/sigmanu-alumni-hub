-- Phase 21 hotfix: wrap stub claim logic in EXCEPTION block
-- Prevents stub claim errors from blocking normal signups
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
        RETURN new;
      END IF;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user stub claim failed: %', SQLERRM;
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
