-- 021_plan_changes.sql
-- Audit log for plan changes made by agency admin
-- + payment tracking fields on clients

create table if not exists plan_changes (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  changed_by uuid not null references users(id),
  new_plan text not null,
  new_billing_period text not null,
  changed_at timestamptz default now()
);

create index if not exists plan_changes_client_id_idx
  on plan_changes(client_id);

create index if not exists plan_changes_changed_at_idx
  on plan_changes(changed_at desc);

alter table plan_changes enable row level security;

-- Payment tracking columns on clients (informational — updated manually until Stripe)
alter table clients add column if not exists
  payment_status text default 'unpaid'
  check (payment_status in ('paid', 'unpaid', 'overdue'));

alter table clients add column if not exists
  next_payment_date date;

alter table clients add column if not exists
  payment_notes text;
