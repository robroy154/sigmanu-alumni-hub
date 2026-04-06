-- Phase 13: Profile expansion — address fields, birthday, privacy toggles
--
-- Adds structured address columns (replacing the old single home_address text blob),
-- an optional birthday date, and three privacy toggle booleans that control
-- visibility of sensitive fields to other authenticated members.
--
-- Privacy enforcement strategy:
--   - show_* flags are always readable by all authenticated members so that
--     application queries can conditionally null out protected fields.
--   - Admin client (service role) bypasses RLS entirely and always sees raw data.
--   - Application code in profile/[id]/page.tsx and directory applies the flags
--     before rendering for non-admin, non-self viewers.

ALTER TABLE public.members
  ADD COLUMN street_address text,
  ADD COLUMN zip            text,
  ADD COLUMN country        text NOT NULL DEFAULT 'USA',
  ADD COLUMN birthday       date,
  ADD COLUMN show_address   boolean NOT NULL DEFAULT true,
  ADD COLUMN show_birthday  boolean NOT NULL DEFAULT true,
  ADD COLUMN show_phone     boolean NOT NULL DEFAULT true;

-- Grant SELECT on new columns to authenticated users.
-- street_address, zip, country are readable so the caller can apply privacy logic.
-- show_* flags must always be readable so callers know what to hide.
GRANT SELECT (
  street_address, zip, country, birthday,
  show_address, show_birthday, show_phone
) ON public.members TO authenticated;

-- The existing UPDATE policy ("members: update own row") locks only status and
-- pin_number via WITH CHECK. All other columns — including the new ones — are
-- already writeable by the row owner. No policy change needed for writes.

-- Comment the legacy home_address column so it is not used in new code.
COMMENT ON COLUMN public.members.home_address IS
  'Legacy: single free-text address field. Superseded by street_address + city + state + zip + country in Phase 13. Do not use in new code.';
