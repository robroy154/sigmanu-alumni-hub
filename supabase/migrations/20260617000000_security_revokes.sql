-- ALREADY APPLIED IN PRODUCTION (recorded in supabase_migrations.schema_migrations).
-- This file was missing from the repo; restored verbatim from the database's
-- migration history on 2026-10-21 so the repo matches what has run.
--
-- Note: the column-level REVOKE SELECT / REVOKE INSERT statements below are no-ops
-- in Supabase's default setup because `authenticated` holds table-level SELECT and
-- INSERT grants (verified via has_column_privilege). Only the UPDATE revokes take
-- effect. See docs/maintenance/2026-10-21-audit.md.

-- Security hardening: column-level privilege revokes for the authenticated role.
--
-- These revokes were previously applied manually via the Supabase dashboard and
-- were not surviving Postgres restarts. This migration commits them permanently
-- so they are replayed on every restart.
--
-- All revokes were verified safe against member-facing queries before inclusion.
-- See docs/ARCHITECTURE.md for the full access control model.

-- ── members.referred_by ───────────────────────────────────────────────────────
-- Who referred a member is admin-only information. Members have no legitimate
-- reason to read this column. Service role (admin client) bypasses all revokes.
REVOKE SELECT (referred_by) ON public.members FROM authenticated;

-- ── members.status ────────────────────────────────────────────────────────────
-- Status changes are admin-only operations. The RLS WITH CHECK on the update
-- policy already blocks self-escalation, but column-level revoke adds a second
-- layer of defense. No member-facing server action writes status directly.
REVOKE UPDATE, INSERT (status) ON public.members FROM authenticated;

-- ── members.pin_number ────────────────────────────────────────────────────────
-- Pin number is set once by the member via setPinNumber() in lib/profile/actions.ts,
-- which explicitly uses createAdminClient() to perform the write. Revoking UPDATE
-- and INSERT here enforces the intent at the DB layer. Admin client bypasses it.
REVOKE UPDATE, INSERT (pin_number) ON public.members FROM authenticated;

-- ── members.id ────────────────────────────────────────────────────────────────
-- Primary keys should never be written by application code. Postgres manages
-- these via gen_random_uuid() defaults.
REVOKE UPDATE, INSERT (id) ON public.members FROM authenticated;

-- ── members.created_at ────────────────────────────────────────────────────────
-- Audit timestamp managed by Postgres. No application code should write this.
REVOKE UPDATE, INSERT (created_at) ON public.members FROM authenticated;

-- ── registrations.stripe_payment_id ──────────────────────────────────────────
-- Stripe payment intent IDs are admin-only. No member-facing query selects this
-- column (verified in src/lib/registration/manageActions.ts and all member
-- route components). Admin client bypasses this revoke.
REVOKE SELECT (stripe_payment_id) ON public.registrations FROM authenticated;

-- ── registration_payments.stripe_payment_id ──────────────────────────────────
-- Same rationale as registrations.stripe_payment_id above.
REVOKE SELECT (stripe_payment_id) ON public.registration_payments FROM authenticated;

-- ── referrals.token ───────────────────────────────────────────────────────────
-- Invite tokens are one-time secrets. Exposing them to authenticated members
-- would allow token hijacking of pending invites. The profile page referrals
-- query does not select this column (verified in src/app/(member)/profile/page.tsx).
REVOKE SELECT (token) ON public.referrals FROM authenticated;

-- ── referrals.email — intentionally NOT revoked ───────────────────────────────
-- The profile page referrals query selects email to display who was invited
-- in the invite section (src/app/(member)/profile/page.tsx). RLS already
-- restricts members to reading only their own referral rows (referred_by = auth.uid()),
-- so email exposure is limited to the inviter seeing their own invitees only.
