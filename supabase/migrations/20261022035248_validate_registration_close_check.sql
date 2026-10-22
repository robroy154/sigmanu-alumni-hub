-- events_registration_closes_before_event was added NOT VALID (20261022025946) because one
-- draft test event closed registration after its event date. NOT VALID still checks a row
-- on every UPDATE, so that event couldn't be edited or archived ("Failed to archive
-- event."). On 2026-10-21 that event (no registrations or waitlist rows) was archived with
-- its close date cleared, which left no violating rows.
--
-- Validate the constraint so it is fully enforced. The UPDATE is a guard for replays on
-- other databases: a close date after the event date is meaningless, so clear it rather
-- than let VALIDATE fail. It matches no rows in production.
UPDATE public.events
SET registration_closes_at = NULL,
    updated_at             = now()
WHERE registration_closes_at > event_date;

ALTER TABLE public.events VALIDATE CONSTRAINT events_registration_closes_before_event;
