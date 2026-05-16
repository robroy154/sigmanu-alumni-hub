-- dismissed_announcements tracks which members have dismissed a "show on login" splash
CREATE TABLE IF NOT EXISTS dismissed_announcements (
  member_id       uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  announcement_id uuid NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
  dismissed_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (member_id, announcement_id)
);

-- RLS: members can read and insert their own dismissed announcements
ALTER TABLE dismissed_announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can read own dismissed announcements"
  ON dismissed_announcements FOR SELECT
  TO authenticated
  USING (member_id = auth.uid());

CREATE POLICY "Members can insert own dismissed announcements"
  ON dismissed_announcements FOR INSERT
  TO authenticated
  WITH CHECK (member_id = auth.uid());

-- show_on_login flag on announcements — admin can mark an announcement to appear as a splash on member login
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS show_on_login boolean NOT NULL DEFAULT false;
