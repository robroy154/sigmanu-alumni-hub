-- Phase 15: Announcements table
-- Used for the authenticated homepage (/home) announcements section.
-- Admins create/manage announcements via /admin/announcements.
-- Members see active announcements on their homepage.

CREATE TABLE public.announcements (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  title      text        NOT NULL,
  body       text        NOT NULL,
  is_active  boolean     NOT NULL DEFAULT true,
  created_by uuid        NOT NULL REFERENCES public.members(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Members can read active announcements
CREATE POLICY "announcements: members read active"
  ON public.announcements FOR SELECT TO authenticated
  USING (is_active = true);

-- Service role (admin client) bypasses RLS — no extra policy needed for admin writes.
