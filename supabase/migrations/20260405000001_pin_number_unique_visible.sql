-- Migration: Make pin_number unique and visible to authenticated users.
--
-- Context: pin_number is a member-chosen identifier (like a fraternity badge number).
-- - Members select it once during profile setup; it cannot be changed by the member afterward.
-- - Admins can update it via the service-role client (bypasses column grants).
-- - It is visible to all authenticated members (not sensitive).
--
-- Changes:
-- 1. Add UNIQUE constraint so no two members can share the same pin_number.
-- 2. Re-grant SELECT on pin_number to authenticated (was revoked in initial_schema).
--    home_address remains revoked — it is still admin/self-only.

alter table public.members
  add constraint members_pin_number_unique unique (pin_number);

-- Restore read access for authenticated users. NULL values are not constrained
-- by the unique index (multiple NULLs are allowed — members who haven't set a
-- pin yet do not conflict with each other).
grant select (pin_number) on public.members to authenticated;

-- Update the column comment to reflect the new visibility rule.
comment on column public.members.pin_number is
  'Member-chosen fraternity pin number. Unique, set once by the member, editable by admins only afterward.';
