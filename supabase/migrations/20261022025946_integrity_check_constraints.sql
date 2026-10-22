-- APPLIED to production 2026-10-21 (version 20261022025946).
-- Database-level backstops for rules the app now validates (event-actions superRefine).

-- Early bird: a price needs an end date and vice versa, must undercut the ticket price,
-- and must end before the event. Prevents the $0-checkout failure mode outright.
ALTER TABLE public.events
  ADD CONSTRAINT events_early_bird_pair
    CHECK ((early_bird_price IS NULL) = (early_bird_ends_at IS NULL)),
  ADD CONSTRAINT events_early_bird_price_valid
    CHECK (early_bird_price IS NULL OR (early_bird_price >= 0 AND early_bird_price < ticket_price)),
  ADD CONSTRAINT events_early_bird_before_event
    CHECK (early_bird_ends_at IS NULL OR early_bird_ends_at <= event_date);

-- NOT VALID: enforced on every insert/update from now on, but one existing draft event
-- (5d6cbce8-7a16-41c9-975b-d969e517cda2) closes after its date and is left for an admin to fix.
-- After fixing it: ALTER TABLE public.events VALIDATE CONSTRAINT events_registration_closes_before_event;
ALTER TABLE public.events
  ADD CONSTRAINT events_registration_closes_before_event
    CHECK (registration_closes_at IS NULL OR registration_closes_at <= event_date) NOT VALID;

ALTER TABLE public.registrations
  ADD CONSTRAINT registrations_amount_paid_nonnegative
    CHECK (amount_paid IS NULL OR amount_paid >= 0),
  ADD CONSTRAINT registrations_applied_price_nonnegative
    CHECK (applied_price IS NULL OR applied_price >= 0);

-- A waitlist entry must identify someone.
ALTER TABLE public.waitlist
  ADD CONSTRAINT waitlist_has_identity
    CHECK (member_id IS NOT NULL OR guest_email IS NOT NULL);
