-- Add is_pinned column to announcements table
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS is_pinned boolean NOT NULL DEFAULT false;
