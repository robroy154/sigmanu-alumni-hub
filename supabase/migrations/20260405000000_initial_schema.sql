-- =============================================================================
-- Sigma Nu Mu Xi Alumni Hub — Initial Schema
-- Migration: 20260405000000_initial_schema.sql
-- =============================================================================


-- ---------------------------------------------------------------------------
-- EXTENSIONS
-- ---------------------------------------------------------------------------
create extension if not exists "pgcrypto";


-- ---------------------------------------------------------------------------
-- TABLES
-- ---------------------------------------------------------------------------

-- members
-- Central table. id matches auth.users.id — auth drives identity, no serial PK.
create table public.members (
  id                 uuid         not null references auth.users (id) on delete cascade,
  email              text         not null,
  first_name         text         not null,
  last_name          text         not null,
  nickname           text,
  pledge_class       text,
  pin_number         text,
  phone              text,
  city               text,
  state              text,
  home_address       text,
  linkedin_url       text,
  profile_photo_url  text,
  big_id             uuid         references public.members (id) on delete set null,
  status             text         not null default 'pending',
  created_at         timestamptz  not null default now(),
  updated_at         timestamptz  not null default now(),

  constraint members_pkey          primary key (id),
  constraint members_email_unique  unique (email),
  constraint members_status_check  check (status in ('pending', 'member', 'admin'))
);

comment on column public.members.big_id       is 'Self-referencing FK. Drives the big/little family tree.';
comment on column public.members.pin_number   is 'Admin-assignable fraternity pin number. Visible to self and admins only.';
comment on column public.members.home_address is 'Visible to self and admins only.';
comment on column public.members.status       is 'pending | member | admin. Default pending. Admins approve to member.';


-- badges
-- Admin-assigned recognition. Members cannot create their own badges.
create table public.badges (
  id           uuid        not null default gen_random_uuid(),
  member_id    uuid        not null references public.members (id) on delete cascade,
  badge_type   text        not null,
  assigned_by  uuid        not null references public.members (id),
  assigned_at  timestamptz not null default now(),

  constraint badges_pkey primary key (id)
);


-- events
create table public.events (
  id                 uuid          not null default gen_random_uuid(),
  title              text          not null,
  description        text,
  event_date         timestamptz   not null,
  location           text,
  ticket_price       numeric(10,2) not null default 0,
  registration_open  boolean       not null default false,
  capacity           integer,
  created_at         timestamptz   not null default now(),
  updated_at         timestamptz   not null default now(),

  constraint events_pkey                  primary key (id),
  constraint events_ticket_price_positive check (ticket_price >= 0),
  constraint events_capacity_positive     check (capacity is null or capacity > 0)
);


-- registrations
-- member_id is nullable — pending users can register before account approval.
create table public.registrations (
  id                   uuid          not null default gen_random_uuid(),
  event_id             uuid          not null references public.events (id) on delete cascade,
  member_id            uuid          references public.members (id) on delete set null,
  registrant_name      text          not null,
  email                text          not null,
  phone                text,
  dietary_restrictions text,
  tshirt_size          text,
  guest_count          integer       not null default 0,
  payment_status       text          not null default 'unpaid',
  stripe_payment_id    text,
  submitted_at         timestamptz   not null default now(),

  constraint registrations_pkey                 primary key (id),
  constraint registrations_tshirt_check         check (tshirt_size is null or tshirt_size in ('S', 'M', 'L', 'XL', 'XXL')),
  constraint registrations_payment_status_check check (payment_status in ('unpaid', 'paid', 'refunded')),
  constraint registrations_guest_count_check    check (guest_count >= 0)
);


-- registration_guests
-- Separate rows for each guest — never a comma-separated field on registrations.
create table public.registration_guests (
  id               uuid not null default gen_random_uuid(),
  registration_id  uuid not null references public.registrations (id) on delete cascade,
  guest_name       text not null,

  constraint registration_guests_pkey primary key (id)
);


-- ---------------------------------------------------------------------------
-- INDEXES
-- ---------------------------------------------------------------------------

-- members
create index members_status_idx           on public.members (status);
create index members_pledge_class_idx     on public.members (pledge_class);
create index members_big_id_idx           on public.members (big_id);

-- badges
create index badges_member_id_idx         on public.badges (member_id);

-- events
create index events_event_date_idx        on public.events (event_date desc);
create index events_registration_open_idx on public.events (registration_open);

-- registrations
create index registrations_event_id_idx       on public.registrations (event_id);
create index registrations_member_id_idx      on public.registrations (member_id);
create index registrations_email_idx          on public.registrations (email);
create index registrations_payment_status_idx on public.registrations (payment_status);

-- registration_guests
create index registration_guests_registration_id_idx
  on public.registration_guests (registration_id);


-- ---------------------------------------------------------------------------
-- TRIGGERS — updated_at auto-maintenance
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger members_set_updated_at
  before update on public.members
  for each row execute function public.set_updated_at();

create trigger events_set_updated_at
  before update on public.events
  for each row execute function public.set_updated_at();


-- ---------------------------------------------------------------------------
-- AUTH TRIGGER — create members row on new auth.users signup
-- ---------------------------------------------------------------------------
-- Fires on every new auth.users insert (email/password AND OAuth).
-- OAuth providers (Google, Apple, Facebook) use different metadata key names —
-- first_name/last_name will be empty string for OAuth signups. Phase 3 detects
-- this and redirects OAuth users to a profile completion screen.

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.members (id, email, first_name, last_name, status)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'first_name', ''),
    coalesce(new.raw_user_meta_data ->> 'last_name', ''),
    'pending'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ---------------------------------------------------------------------------
-- ROW LEVEL SECURITY
-- ---------------------------------------------------------------------------

alter table public.members             enable row level security;
alter table public.badges              enable row level security;
alter table public.events              enable row level security;
alter table public.registrations       enable row level security;
alter table public.registration_guests enable row level security;


-- Helper function: returns the status of the currently authenticated user.
-- Used in every RLS policy to avoid repetitive subqueries.
-- security definer so it can read members regardless of the caller's RLS context.
create or replace function public.current_member_status()
returns text language sql stable security definer set search_path = public
as $$
  select status from public.members where id = auth.uid();
$$;


-- ---- MEMBERS POLICIES -------------------------------------------------------

-- Any authenticated user can always read their own row (needed for all statuses).
create policy "members: read own row"
  on public.members for select
  using (id = auth.uid());

-- member and admin can read all rows (for directory and family tree).
create policy "members: member+ can read all"
  on public.members for select
  using (public.current_member_status() in ('member', 'admin'));

-- Members can update only their own row.
-- Self-escalation blocked: cannot change own status or pin_number via this policy.
create policy "members: update own row"
  on public.members for update
  using (id = auth.uid())
  with check (
    id = auth.uid()
    and status = (select status from public.members where id = auth.uid())
    and pin_number is not distinct from (select pin_number from public.members where id = auth.uid())
  );

-- Admins can update any row (including status, pin_number, big_id).
create policy "members: admin can update all"
  on public.members for update
  using (public.current_member_status() = 'admin');

-- Admin-only delete.
create policy "members: admin can delete"
  on public.members for delete
  using (public.current_member_status() = 'admin');

-- Column-level security for sensitive fields.
-- pin_number and home_address are excluded from the default authenticated grant.
-- Application layer further enforces this by fetching them only via service-role
-- client in server-only routes.
revoke select (pin_number, home_address) on public.members from authenticated;
grant select (
  id, email, first_name, last_name, nickname, pledge_class,
  phone, city, state, linkedin_url, profile_photo_url,
  big_id, status, created_at, updated_at
) on public.members to authenticated;


-- ---- BADGES POLICIES --------------------------------------------------------

create policy "badges: member+ can read all"
  on public.badges for select
  using (public.current_member_status() in ('member', 'admin'));

create policy "badges: admin can insert"
  on public.badges for insert
  with check (public.current_member_status() = 'admin');

create policy "badges: admin can update"
  on public.badges for update
  using (public.current_member_status() = 'admin');

create policy "badges: admin can delete"
  on public.badges for delete
  using (public.current_member_status() = 'admin');


-- ---- EVENTS POLICIES --------------------------------------------------------

-- pending+ can read open events (needed for the registration form).
create policy "events: pending+ can read open events"
  on public.events for select
  using (registration_open = true and auth.uid() is not null);

-- member+ can read all events including closed/draft ones.
create policy "events: member+ can read all"
  on public.events for select
  using (public.current_member_status() in ('member', 'admin'));

create policy "events: admin can insert"
  on public.events for insert
  with check (public.current_member_status() = 'admin');

create policy "events: admin can update"
  on public.events for update
  using (public.current_member_status() = 'admin');

create policy "events: admin can delete"
  on public.events for delete
  using (public.current_member_status() = 'admin');


-- ---- REGISTRATIONS POLICIES -------------------------------------------------

-- Users can read their own registrations.
create policy "registrations: read own"
  on public.registrations for select
  using (member_id = auth.uid());

-- Admin can read all registrations.
create policy "registrations: admin can read all"
  on public.registrations for select
  using (public.current_member_status() = 'admin');

-- Any authenticated user (pending+) can submit a registration.
-- member_id must be null (for pending users not yet linked) or match the caller.
create policy "registrations: authenticated can insert"
  on public.registrations for insert
  with check (
    auth.uid() is not null
    and (member_id is null or member_id = auth.uid())
  );

-- member+ can update their own registration.
create policy "registrations: member can update own"
  on public.registrations for update
  using (
    member_id = auth.uid()
    and public.current_member_status() in ('member', 'admin')
  );

-- Admin can update any registration (for corrections, refund processing, etc.).
create policy "registrations: admin can update all"
  on public.registrations for update
  using (public.current_member_status() = 'admin');

-- Admin-only delete.
create policy "registrations: admin can delete"
  on public.registrations for delete
  using (public.current_member_status() = 'admin');


-- ---- REGISTRATION_GUESTS POLICIES -------------------------------------------

-- Users can read guests tied to their own registrations.
create policy "registration_guests: read own"
  on public.registration_guests for select
  using (
    registration_id in (
      select id from public.registrations where member_id = auth.uid()
    )
  );

-- Admin can read all guest records.
create policy "registration_guests: admin can read all"
  on public.registration_guests for select
  using (public.current_member_status() = 'admin');

-- Authenticated users can insert guests for their own registrations.
create policy "registration_guests: insert for own registration"
  on public.registration_guests for insert
  with check (
    auth.uid() is not null
    and registration_id in (
      select id from public.registrations where member_id = auth.uid()
    )
  );

-- Admin can update and delete any guest record.
create policy "registration_guests: admin can update"
  on public.registration_guests for update
  using (public.current_member_status() = 'admin');

create policy "registration_guests: admin can delete"
  on public.registration_guests for delete
  using (public.current_member_status() = 'admin');


-- ---------------------------------------------------------------------------
-- STORAGE — profile-photos bucket (private)
-- ---------------------------------------------------------------------------
-- Objects are stored at path: {user_id}/{filename}
-- Signed URLs are used for access — no public URLs.

insert into storage.buckets (id, name, public)
values ('profile-photos', 'profile-photos', false)
on conflict (id) do nothing;

-- Authenticated users can upload to their own user-id prefix.
create policy "storage: upload own photo"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'profile-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Authenticated users can replace their own photo.
create policy "storage: update own photo"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'profile-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Authenticated users can delete their own photo.
create policy "storage: delete own photo"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'profile-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Admins can delete any photo (e.g., inappropriate content removal).
create policy "storage: admin can delete any photo"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'profile-photos'
    and public.current_member_status() = 'admin'
  );

-- member+ can read (download) any profile photo via signed URL.
create policy "storage: member+ can read all photos"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'profile-photos'
    and public.current_member_status() in ('member', 'admin')
  );

-- A user can always read their own photo (needed for pending users).
create policy "storage: read own photo"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'profile-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
