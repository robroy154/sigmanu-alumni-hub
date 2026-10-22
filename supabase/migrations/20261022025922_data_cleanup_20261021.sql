-- APPLIED to production 2026-10-21 (version 20261022025922). One-time data fix; on a fresh
-- database it finds no matching rows and is a no-op apart from creating the snapshot tables.
--
-- Originals of every changed row are in maintenance.members_20261021 (34 rows) and
-- maintenance.events_20261021 (3 rows). The maintenance schema is not exposed to the API.
-- To revert one member: UPDATE public.members m SET <cols> = s.<cols>
--   FROM maintenance.members_20261021 s WHERE m.id = s.id AND m.id = '<uuid>';
CREATE SCHEMA IF NOT EXISTS maintenance;
REVOKE ALL ON SCHEMA maintenance FROM PUBLIC, anon, authenticated;

CREATE TABLE maintenance.members_20261021 AS
SELECT id, first_name, last_name, nickname, pledge_class, phone, street_address,
       city, state, zip, country, linkedin_url, now() AS snapshot_at
FROM public.members
WHERE country LIKE '%@%'
   OR (lower(replace(trim(country), '.', '')) IN ('us', 'usa', 'united states', 'united states of america') AND country <> 'USA')
   OR (state ~* '^[a-z]{2}$' AND state <> upper(state))
   OR lower(trim(state)) = 'georgia'
   OR trim(coalesce(nickname, 'x')) = '' OR trim(coalesce(pledge_class, 'x')) = ''
   OR trim(coalesce(phone, 'x')) = '' OR trim(coalesce(street_address, 'x')) = ''
   OR trim(coalesce(city, 'x')) = '' OR trim(coalesce(state, 'x')) = ''
   OR trim(coalesce(zip, 'x')) = '' OR trim(coalesce(linkedin_url, 'x')) = ''
   OR first_name <> trim(first_name) OR last_name <> trim(last_name);

CREATE TABLE maintenance.events_20261021 AS
SELECT id, early_bird_price, early_bird_ends_at, now() AS snapshot_at
FROM public.events
WHERE early_bird_price IS NOT NULL AND early_bird_ends_at IS NULL;

-- Country: one row had an email address typed into it; its address is Columbus, GA 31907.
UPDATE public.members SET country = 'USA'
WHERE id = '8333bcfa-0633-44c6-9e64-550dfdf9add8' AND country LIKE '%@%';

-- Country: US spelling variants -> canonical 'USA' (matches the column default).
UPDATE public.members SET country = 'USA'
WHERE lower(replace(trim(country), '.', '')) IN ('us', 'usa', 'united states', 'united states of america')
  AND country <> 'USA';

-- State: mixed-case codes (Fl, Ga, Tx) and the spelled-out name. All rows verified as US
-- addresses with ZIPs matching the state.
UPDATE public.members SET state = upper(state) WHERE state ~* '^[a-z]{2}$' AND state <> upper(state);
UPDATE public.members SET state = 'GA' WHERE lower(trim(state)) = 'georgia';

-- Empty strings -> NULL so "not provided" has one representation.
UPDATE public.members SET
  nickname       = NULLIF(trim(nickname), ''),
  pledge_class   = NULLIF(trim(pledge_class), ''),
  phone          = NULLIF(trim(phone), ''),
  street_address = NULLIF(trim(street_address), ''),
  city           = NULLIF(trim(city), ''),
  state          = NULLIF(trim(state), ''),
  zip            = NULLIF(trim(zip), ''),
  linkedin_url   = NULLIF(trim(linkedin_url), '')
WHERE trim(coalesce(nickname, 'x')) = '' OR trim(coalesce(pledge_class, 'x')) = ''
   OR trim(coalesce(phone, 'x')) = '' OR trim(coalesce(street_address, 'x')) = ''
   OR trim(coalesce(city, 'x')) = '' OR trim(coalesce(state, 'x')) = ''
   OR trim(coalesce(zip, 'x')) = '' OR trim(coalesce(linkedin_url, 'x')) = '';

-- Names with stray leading/trailing whitespace.
UPDATE public.members SET first_name = trim(first_name), last_name = trim(last_name)
WHERE first_name <> trim(first_name) OR last_name <> trim(last_name);

-- Events: the form bug saved early_bird_price = 0 with no end date. NULL means "no early bird".
UPDATE public.events SET early_bird_price = NULL
WHERE early_bird_price IS NOT NULL AND early_bird_ends_at IS NULL;
