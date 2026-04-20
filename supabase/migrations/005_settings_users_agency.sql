-- Agency singleton settings, user profile fields, client archive & manager prefs

create table if not exists public.agency_settings (
  id text primary key default 'singleton' check (id = 'singleton'),
  agency_name text,
  logo_url text,
  default_response_time_limit_hours int not null default 2,
  default_currency text not null default 'USD',
  default_timezone text not null default 'America/New_York',
  terms_url text,
  privacy_url text,
  updated_at timestamptz not null default now()
);

insert into public.agency_settings (id) values ('singleton')
  on conflict (id) do nothing;

alter table public.users
  add column if not exists avatar_url text,
  add column if not exists notification_prefs jsonb default '{"whatsapp":true,"email":true,"followUpReminders":true}'::jsonb,
  add column if not exists session_version int not null default 0,
  add column if not exists round_robin_order int not null default 0;

alter table public.clients
  add column if not exists manager_notification_prefs jsonb default '{"newLead":true,"dealWon":true,"overdueLead":true}'::jsonb,
  add column if not exists is_archived boolean not null default false;
