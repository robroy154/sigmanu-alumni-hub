-- Per-attendee field scoping experiment
-- Branch: feature/enhanced-events
-- NOT for production — do not apply without review

-- Add field_scope to event_fields
ALTER TABLE public.event_fields
  ADD COLUMN IF NOT EXISTS field_scope text NOT NULL DEFAULT 'registration'
  CHECK (field_scope IN ('registration', 'attendee'));

-- Add optional contact fields to registration_guests
ALTER TABLE public.registration_guests
  ADD COLUMN IF NOT EXISTS guest_email text,
  ADD COLUMN IF NOT EXISTS guest_phone text;

-- Per-guest attendee-scoped field responses
CREATE TABLE IF NOT EXISTS public.guest_field_responses (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id        uuid        NOT NULL REFERENCES public.registration_guests(id)
                              ON DELETE CASCADE,
  field_id        uuid        NOT NULL REFERENCES public.event_fields(id)
                              ON DELETE CASCADE,
  response_value  text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.guest_field_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "guest_field_responses: read own via registration"
  ON public.guest_field_responses FOR SELECT
  USING (
    guest_id IN (
      SELECT rg.id FROM public.registration_guests rg
      JOIN public.registrations r ON r.id = rg.registration_id
      WHERE r.member_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS guest_field_responses_guest_id_idx
  ON public.guest_field_responses (guest_id);

CREATE INDEX IF NOT EXISTS guest_field_responses_field_id_idx
  ON public.guest_field_responses (field_id);
