-- Leadstaq — run in Supabase SQL Editor or via CLI
-- PostgreSQL + Supabase (no Prisma)

create extension if not exists "pgcrypto";

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  industry text not null,
  slug text not null unique,
  logo_url text,
  primary_color text default '#00D4FF',
  response_time_limit_hours int not null default 2,
  round_robin_index int not null default 0,
  twilio_whatsapp_override text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  fb_access_token text,
  fb_page_id text,
  fb_form_id text,
  fb_form_name text,
  fb_webhook_verified boolean default false,
  last_lead_received_at timestamptz
);

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  password text not null,
  role text not null check (role in ('AGENCY_ADMIN', 'CLIENT_MANAGER', 'SALESPERSON')),
  client_id uuid references public.clients(id) on delete set null,
  phone text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_users_client on public.users(client_id);
create index if not exists idx_users_email on public.users(email);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  assigned_to_id uuid references public.users(id) on delete set null,
  source text not null check (source in ('LANDING_PAGE', 'FACEBOOK', 'MANUAL')),
  status text not null check (status in (
    'NEW', 'CONTACTED', 'NEGOTIATING', 'PROPOSAL_SENT', 'WON', 'LOST', 'NOT_QUALIFIED'
  )),
  form_data jsonb not null default '{}',
  name text,
  phone text,
  email text,
  budget text,
  project_type text,
  timeline text,
  magic_token text unique,
  magic_token_expires_at timestamptz,
  not_qualified_reason text,
  deal_value numeric,
  follow_up_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_leads_client on public.leads(client_id);
create index if not exists idx_leads_assigned on public.leads(assigned_to_id);
create index if not exists idx_leads_magic on public.leads(magic_token);
create index if not exists idx_leads_status on public.leads(status);
create index if not exists idx_leads_created on public.leads(created_at);

create table if not exists public.call_logs (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  outcome text not null check (outcome in (
    'ANSWERED', 'NO_ANSWER', 'FOLLOW_UP', 'WON', 'NOT_QUALIFIED'
  )),
  notes text,
  follow_up_date date,
  created_at timestamptz not null default now()
);

create index if not exists idx_call_logs_lead on public.call_logs(lead_id);

create table if not exists public.form_schemas (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null unique references public.clients(id) on delete cascade,
  fields jsonb not null default '[]',
  thank_you_message text,
  form_title text default 'Contact us',
  submit_button_text text default 'Submit',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.landing_pages (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null unique references public.clients(id) on delete cascade,
  hero_headline text,
  hero_subheadline text,
  hero_image_url text,
  about_text text,
  about_image_url text,
  about_company_name text,
  about_tagline text,
  about_stats text,
  services jsonb default '[]',
  projects jsonb default '[]',
  testimonials jsonb default '[]',
  cta_text text,
  primary_color text,
  font_choice text,
  published boolean default false,
  custom_domain text,
  footer_contact text,
  footer_social jsonb default '[]',
  footer_copyright text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  type text not null check (type in (
    'NEW_LEAD', 'FOLLOW_UP_DUE', 'DEAL_WON', 'LEAD_FLAG'
  )),
  message text not null,
  read boolean not null default false,
  lead_id uuid references public.leads(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_user on public.notifications(user_id);
create index if not exists idx_notifications_read on public.notifications(read);

alter table public.clients enable row level security;
alter table public.users enable row level security;
alter table public.leads enable row level security;
alter table public.call_logs enable row level security;
alter table public.form_schemas enable row level security;
alter table public.landing_pages enable row level security;
alter table public.notifications enable row level security;

-- Service role bypasses RLS; anon key blocked unless policies added.
-- For server-only access via service role, default deny for anon is fine.
