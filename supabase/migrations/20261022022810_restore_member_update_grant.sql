-- Restore member self-service writes on public.members.
--
-- APPLIED to production 2026-10-21 ~22:28 ET via Supabase MCP apply_migration
-- (recorded as version 20261022022810). Verified with has_column_privilege afterward.
--
-- Problem: at some point after 20260617000000_security_revokes, a table-level
-- `REVOKE UPDATE ON public.members FROM authenticated` was run by hand (it is in
-- no migration). The table ACL for authenticated is `ardDxtm` (no `w`), so every
-- session-client UPDATE on members fails with "permission denied for table members":
--   - updateProfile, updateProfilePhoto   (src/lib/profile/actions.ts)
--   - completeProfile, dismissOnboarding  (src/lib/auth/actions.ts)
--   - signup profile fields + big_id      (src/components/auth/SignupForm.tsx)
--   - join big_id                         (src/components/auth/JoinForm.tsx)
--
-- Fix: grant UPDATE back on exactly the columns those paths write. With no
-- table-level UPDATE grant, column-level grants ARE enforced (unlike the column
-- REVOKEs in the 20260617 migration, which the table grant overrode). Everything
-- not listed stays locked to the service role: id, email, status, pin_number,
-- referred_by, home_address, created_at, updated_at.
--
-- updated_at is maintained by the set_updated_at trigger; Postgres checks column
-- privileges only for columns in the UPDATE's SET list, so the trigger still works.
--
-- big_id is included only because SignupForm/JoinForm write it with the session
-- client. Follow-up: route those writes through the existing setBigBrother server
-- action (admin client + ownership check), then revoke UPDATE (big_id) here.
--
-- RLS still applies on top of this: "members: update own row" limits members to
-- their own row.

GRANT UPDATE (
  first_name,
  last_name,
  nickname,
  pledge_class,
  phone,
  street_address,
  city,
  state,
  zip,
  country,
  birthday,
  linkedin_url,
  profile_photo_url,
  show_address,
  show_birthday,
  show_phone,
  newsletter_opt_out,
  onboarding_dismissed,
  big_id
) ON public.members TO authenticated;

-- Verification (expect true for listed columns, false for status/pin_number/email):
-- SELECT column_name, has_column_privilege('authenticated', 'public.members', column_name, 'UPDATE')
-- FROM information_schema.columns
-- WHERE table_schema = 'public' AND table_name = 'members'
-- ORDER BY 1;
