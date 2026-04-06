-- Phase 11: Add status enum to events table
-- Replaces the boolean registration_open as the primary visibility control.

CREATE TYPE event_status AS ENUM ('draft', 'published', 'archived');

ALTER TABLE public.events
  ADD COLUMN status event_status NOT NULL DEFAULT 'draft';

-- Migrate existing data from registration_open flag
UPDATE public.events SET status = 'published' WHERE registration_open = true;
UPDATE public.events SET status = 'draft'     WHERE registration_open = false;

-- Partial index for homepage and public event queries
CREATE INDEX events_status_date_idx
  ON public.events (event_date ASC)
  WHERE status = 'published';
