-- CAN-SPAM compliance: allow members to opt out of non-transactional emails
ALTER TABLE members ADD COLUMN IF NOT EXISTS newsletter_opt_out boolean NOT NULL DEFAULT false;
