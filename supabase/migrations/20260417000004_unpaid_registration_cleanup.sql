-- Migration: 20260417000004_unpaid_registration_cleanup
-- Schedules a daily pg_cron job to purge orphaned unpaid registrations
-- that are more than 24 hours old (i.e. the user abandoned Stripe checkout
-- or their payment failed and they never retried).
--
-- PREREQUISITE: pg_cron extension must be enabled before this migration runs.
--   Dashboard → Database → Extensions → search "pg_cron" → Enable
--   (The extension lives in the pg_cron schema, not public.)
--
-- This migration is idempotent: it unschedules any existing job with the same
-- name before creating the new one, so re-running it is safe.

CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Remove existing job if present (returns false, not an error, when absent).
SELECT cron.unschedule('cleanup-unpaid-registrations')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'cleanup-unpaid-registrations'
);

-- Schedule daily cleanup of orphaned unpaid registrations.
-- Runs at 3:00 AM UTC every day.
-- Cascade deletes on registration_guests, event_field_responses, and
-- registration_payments are handled automatically by FK ON DELETE CASCADE.
SELECT cron.schedule(
  'cleanup-unpaid-registrations',
  '0 3 * * *',
  $$
    DELETE FROM public.registrations
    WHERE payment_status = 'unpaid'
      AND submitted_at < NOW() - INTERVAL '24 hours';
  $$
);
