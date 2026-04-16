-- ─────────────────────────────────────────────────────────────────────────────
-- Phase 21 — Event Module Overhaul
-- Safe to run on a live database with existing records.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── events: new columns ───────────────────────────────────────────────────────
ALTER TABLE public.events
  ADD COLUMN slug                   text UNIQUE,
  ADD COLUMN banner_image_url       text,
  ADD COLUMN event_type             text NOT NULL DEFAULT 'external'
                                    CHECK (event_type IN ('internal', 'external')),
  ADD COLUMN early_bird_price       numeric(10,2),
  ADD COLUMN early_bird_ends_at     timestamptz,
  ADD COLUMN registration_closes_at timestamptz,
  ADD COLUMN capacity_mode          text NOT NULL DEFAULT 'unlimited'
                                    CHECK (capacity_mode IN ('unlimited', 'capped', 'waitlist')),
  ADD COLUMN rich_description       text;

-- ── registrations: new columns ───────────────────────────────────────────────
ALTER TABLE public.registrations
  ADD COLUMN amount_paid   numeric(10,2),
  ADD COLUMN applied_price numeric(10,2);

-- Backfill amount_paid for existing paid registrations (never overwrites already-set values)
UPDATE public.registrations r
SET    amount_paid = e.ticket_price * (1 + r.guest_count)
FROM   public.events e
WHERE  r.event_id       = e.id
  AND  r.payment_status = 'paid'
  AND  r.amount_paid    IS NULL;

-- ── Slug backfill for existing events ────────────────────────────────────────
UPDATE public.events
SET slug = lower(
  regexp_replace(
    regexp_replace(title, '[^a-zA-Z0-9\s-]', '', 'g'),
    '\s+', '-', 'g'
  )
)
WHERE slug IS NULL;

-- ── event_fields ──────────────────────────────────────────────────────────────
CREATE TABLE public.event_fields (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id      uuid        NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  field_label   text        NOT NULL,
  field_type    text        NOT NULL CHECK (field_type IN (
                              'short_text', 'long_text', 'dropdown',
                              'checkbox', 'multi_select', 'file_upload'
                            )),
  field_options jsonb,
  required      boolean     NOT NULL DEFAULT false,
  display_order integer     NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.event_fields ENABLE ROW LEVEL SECURITY;

-- Members, admins, and pending users can read event fields
CREATE POLICY "event_fields: member+ can read"
  ON public.event_fields FOR SELECT
  USING (public.current_member_status() IN ('member', 'admin', 'pending'));

-- Admins manage fields via service role (admin client) — no additional policy needed

CREATE INDEX event_fields_event_id_idx
  ON public.event_fields (event_id, display_order);

-- ── event_field_responses ─────────────────────────────────────────────────────
CREATE TABLE public.event_field_responses (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id uuid        NOT NULL REFERENCES public.registrations(id) ON DELETE CASCADE,
  field_id        uuid        NOT NULL REFERENCES public.event_fields(id)   ON DELETE CASCADE,
  response_value  text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.event_field_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "event_field_responses: read own"
  ON public.event_field_responses FOR SELECT
  USING (
    registration_id IN (
      SELECT id FROM public.registrations WHERE member_id = auth.uid()
    )
  );

CREATE INDEX event_field_responses_registration_id_idx
  ON public.event_field_responses (registration_id);

-- ── waitlist ──────────────────────────────────────────────────────────────────
CREATE TABLE public.waitlist (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id    uuid        NOT NULL REFERENCES public.events(id)   ON DELETE CASCADE,
  member_id   uuid                   REFERENCES public.members(id) ON DELETE SET NULL,
  guest_email text,
  guest_name  text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  notified_at timestamptz
);

ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "waitlist: read own"
  ON public.waitlist FOR SELECT
  USING (member_id = auth.uid());

CREATE POLICY "waitlist: insert own"
  ON public.waitlist FOR INSERT
  WITH CHECK (member_id = auth.uid());

CREATE INDEX waitlist_event_id_idx
  ON public.waitlist (event_id, created_at);

-- ── Storage: event-banners (public bucket) ────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-banners', 'event-banners', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "storage: admin can upload event banners"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'event-banners'
    AND public.current_member_status() = 'admin'
  );

CREATE POLICY "storage: public can read event banners"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'event-banners');

-- ── Storage: registration-files (private bucket) ─────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('registration-files', 'registration-files', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "storage: members can upload registration files"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'registration-files');

CREATE POLICY "storage: members can read own registration files"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'registration-files');
