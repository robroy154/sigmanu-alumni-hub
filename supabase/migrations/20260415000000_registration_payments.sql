create table public.registration_payments (
  id                 uuid          not null default gen_random_uuid(),
  registration_id    uuid          not null references public.registrations (id) on delete cascade,
  stripe_payment_id  text          not null,
  amount             numeric(10,2) not null,
  guest_count_delta  integer       not null,
  created_at         timestamptz   not null default now(),

  constraint registration_payments_pkey primary key (id),
  constraint registration_payments_amount_positive check (amount > 0),
  constraint registration_payments_delta_positive check (guest_count_delta > 0)
);

create index registration_payments_registration_id_idx
  on public.registration_payments (registration_id);

alter table public.registration_payments enable row level security;

-- Members can read payments tied to their own registrations
create policy "registration_payments: read own"
  on public.registration_payments for select
  using (
    registration_id in (
      select id from public.registrations where member_id = auth.uid()
    )
  );

-- Admin can read all
create policy "registration_payments: admin read all"
  on public.registration_payments for select
  using (public.current_member_status() = 'admin');

-- Inserts via service role only (webhook handler) — no authenticated insert policy

alter table public.registrations
  add column pending_guests jsonb;
