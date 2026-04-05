-- Seed: 30th Anniversary Reunion event.
--
-- Runs as postgres (superuser) so RLS policies are bypassed.
-- Update event_date time, location detail, and ticket_price as needed
-- via the Supabase Table Editor — this migration just gets the row in place.
--
-- ticket_price is per attendee (registrant + each additional guest).

insert into public.events (
  title,
  description,
  event_date,
  location,
  ticket_price,
  registration_open,
  capacity
) values (
  '30th Anniversary Reunion',
  'Celebrate 30 years of Sigma Nu Mu Xi Chapter at Columbus State University. Join brothers from across the years for an evening of reconnection, reflection, and brotherhood.',
  '2026-06-27T18:00:00-04:00',   -- 6:00 PM EDT — adjust if needed
  'Columbus Trade Center',
  100.00,
  true,
  null  -- unlimited capacity; set an integer if you need a cap
);
