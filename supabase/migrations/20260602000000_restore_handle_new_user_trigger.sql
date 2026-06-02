-- Restore handle_new_user to correct UPDATE-in-place logic.
-- Migration 20260421000000 accidentally reverted to the old INSERT+DELETE pattern
-- while adding diagnostic RAISE LOG statements. This reinstates the fix from
-- 20260417000003 (array_agg + UPDATE stub row in place) and removes all RAISE LOG lines.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  stub_id    uuid;
  stub_row   public.members%ROWTYPE;
  little_ids uuid[];
BEGIN
  BEGIN
    stub_id := (new.raw_user_meta_data->>'stub_id')::uuid;

    IF stub_id IS NOT NULL THEN
      SELECT * INTO stub_row FROM public.members
      WHERE id = stub_id AND status = 'stub';

      IF FOUND THEN
        -- Store IDs of all littles pointing to this stub
        SELECT array_agg(id) INTO little_ids
        FROM public.members
        WHERE big_id = stub_id;

        -- NULL out their big_id to release FK constraint before PK update
        UPDATE public.members
        SET big_id = NULL
        WHERE big_id = stub_id;

        -- Update stub row in place with new auth user's id
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

        -- Re-point all stored littles to the new real member id
        IF little_ids IS NOT NULL THEN
          UPDATE public.members
          SET big_id = new.id
          WHERE id = ANY(little_ids);
        END IF;

        RETURN new;
      END IF;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user stub claim failed: % %', SQLERRM, SQLSTATE;
  END;

  -- Normal signup path
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
