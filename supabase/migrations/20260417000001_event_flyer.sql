-- Add flyer_url column to events table.
-- Flyer is uploaded to the existing event-banners bucket (no new bucket needed).
-- Path: event-banners/[event-id]/flyer.[ext]

ALTER TABLE public.events
  ADD COLUMN flyer_url text;
