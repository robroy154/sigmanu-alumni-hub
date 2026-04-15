alter table public.announcements
  add column notify_members boolean not null default false;
