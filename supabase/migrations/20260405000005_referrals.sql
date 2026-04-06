-- Phase 14: Referral / Invite System
--
-- Creates the referrals table and adds referred_by to members.
-- Tokens are one-time UUIDs valid for 7 days.
-- referred_by on members is admin-only (column SELECT revoked from authenticated).

-- ── Enum ──────────────────────────────────────────────────────────────────────
CREATE TYPE referral_status AS ENUM ('pending', 'completed', 'expired');

-- ── referrals table ───────────────────────────────────────────────────────────
CREATE TABLE public.referrals (
  id           uuid            PRIMARY KEY DEFAULT gen_random_uuid(),
  referred_by  uuid            NOT NULL REFERENCES public.members(id),
  first_name   text            NOT NULL,
  last_name    text            NOT NULL,
  email        text            NOT NULL,
  token        uuid            UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  status       referral_status NOT NULL DEFAULT 'pending',
  created_at   timestamptz     NOT NULL DEFAULT now(),
  completed_at timestamptz,
  expires_at   timestamptz     NOT NULL DEFAULT (now() + interval '7 days')
);

-- Index for token lookups (public /join route queries by token)
CREATE INDEX referrals_token_idx ON public.referrals (token);

-- Index for member's own referrals list (profile page query)
CREATE INDEX referrals_referred_by_idx ON public.referrals (referred_by, created_at DESC);

-- ── RLS ───────────────────────────────────────────────────────────────────────
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Authenticated members can insert referrals where they are the referrer.
CREATE POLICY "referrals: member insert"
  ON public.referrals
  FOR INSERT
  TO authenticated
  WITH CHECK (referred_by = auth.uid());

-- Members can only read their own referrals (referred_by = their own uid).
CREATE POLICY "referrals: member read own"
  ON public.referrals
  FOR SELECT
  TO authenticated
  USING (referred_by = auth.uid());

-- No UPDATE or DELETE policies for authenticated role.
-- All mutations (completing / expiring) use the service role (admin client).

-- ── referred_by on members ────────────────────────────────────────────────────
ALTER TABLE public.members
  ADD COLUMN referred_by uuid REFERENCES public.members(id);

-- Revoke column-level SELECT from authenticated so referred_by is admin-only.
-- The service role (createAdminClient) bypasses all column grants.
REVOKE SELECT (referred_by) ON public.members FROM authenticated;

-- ── Token expiry maintenance (pg_cron) ────────────────────────────────────────
--
-- To enable automatic nightly expiry of stale pending referrals, configure
-- pg_cron in the Supabase dashboard:
--
-- STEP 1: Enable the pg_cron extension
--   Dashboard → Database → Extensions → search "pg_cron" → Enable
--
-- STEP 2: Create the cron job
--   Dashboard → Database → Cron Jobs → "+ New cron job"
--   Name:     expire_pending_referrals
--   Schedule: 0 2 * * *   (runs at 2:00 AM UTC every day)
--   Command:
--     UPDATE public.referrals
--     SET status = 'expired'
--     WHERE status = 'pending'
--       AND expires_at < now();
--
-- Alternatively run via SQL editor:
--   SELECT cron.schedule(
--     'expire_pending_referrals',
--     '0 2 * * *',
--     $$UPDATE public.referrals SET status = 'expired'
--       WHERE status = 'pending' AND expires_at < now()$$
--   );
