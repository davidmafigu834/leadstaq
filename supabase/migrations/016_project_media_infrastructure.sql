-- Project Media Infrastructure — replaces landing page builder

-- Drop landing page tables (cleanly, after removing FK references)
drop table if exists public.landing_page_templates cascade;
drop table if exists public.landing_pages cascade;

-- Projects table
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  title text not null,
  description text,
  category text,
  location text,
  completion_date date,
  is_featured boolean default false,
  is_public boolean default true,
  display_order integer default 0,
  slug text unique,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_projects_client on public.projects(client_id);
create index if not exists idx_projects_slug on public.projects(slug);
create index if not exists idx_projects_featured on public.projects(client_id, is_featured, is_public);

-- Project media table
create table if not exists public.project_media (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  type text not null check (type in ('photo', 'video_url')),
  storage_key text,
  public_url text,
  caption text,
  display_order integer default 0,
  file_size_bytes bigint,
  width integer,
  height integer,
  created_at timestamptz default now()
);

create index if not exists idx_project_media_project on public.project_media(project_id);
create index if not exists idx_project_media_client on public.project_media(client_id);

-- Testimonials table
create table if not exists public.testimonials (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  author_name text not null,
  author_role text,
  content text not null,
  rating integer check (rating between 1 and 5),
  photo_url text,
  video_url text,
  is_featured boolean default false,
  display_order integer default 0,
  created_at timestamptz default now()
);

create index if not exists idx_testimonials_client on public.testimonials(client_id);

-- Client profile page settings
create table if not exists public.client_profiles (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null unique references public.clients(id) on delete cascade,
  slug text unique not null,
  headline text,
  subheadline text,
  hero_image_key text,
  hero_image_url text,
  cta_text text default 'Get a Free Quote',
  form_title text default 'Start Your Project',
  is_published boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_client_profiles_client on public.client_profiles(client_id);
create index if not exists idx_client_profiles_slug on public.client_profiles(slug);

-- Multi-step form configuration
create table if not exists public.form_steps (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  step_number integer not null,
  title text not null,
  display_order integer default 0
);

create index if not exists idx_form_steps_client on public.form_steps(client_id);

create table if not exists public.form_fields (
  id uuid primary key default gen_random_uuid(),
  step_id uuid not null references public.form_steps(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  field_type text not null check (field_type in ('text', 'phone', 'email', 'select', 'multiselect', 'textarea', 'number')),
  label text not null,
  placeholder text,
  options jsonb,
  is_required boolean default false,
  maps_to text,
  display_order integer default 0
);

create index if not exists idx_form_fields_step on public.form_fields(step_id);
create index if not exists idx_form_fields_client on public.form_fields(client_id);

-- RLS
alter table public.projects enable row level security;
alter table public.project_media enable row level security;
alter table public.testimonials enable row level security;
alter table public.client_profiles enable row level security;
alter table public.form_steps enable row level security;
alter table public.form_fields enable row level security;

-- Public read policies (anon can read published/public content)
create policy "projects_public_read" on public.projects
  for select using (is_public = true);

create policy "project_media_public_read" on public.project_media
  for select using (
    exists (select 1 from public.projects p where p.id = project_id and p.is_public = true)
  );

create policy "testimonials_public_read" on public.testimonials
  for select using (true);

create policy "client_profiles_public_read" on public.client_profiles
  for select using (is_published = true);

create policy "form_steps_public_read" on public.form_steps
  for select using (true);

create policy "form_fields_public_read" on public.form_fields
  for select using (true);

-- Service role bypasses RLS — all agency mutations go through service role (admin client).
-- The following policies allow the service-role-backed admin client to operate freely.
-- (Service role already bypasses RLS; these are for future RLS-based auth if needed.)

-- Slug auto-generation trigger for projects
create or replace function public.generate_project_slug()
returns trigger as $$
begin
  if new.slug is null then
    new.slug := lower(regexp_replace(new.title, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substr(new.id::text, 1, 8);
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_project_slug on public.projects;
create trigger set_project_slug
before insert on public.projects
for each row execute function public.generate_project_slug();

-- Backfill client_profiles for existing clients using their slug
insert into public.client_profiles (client_id, slug, is_published)
select id, slug, false
from public.clients
where not exists (
  select 1 from public.client_profiles cp where cp.client_id = clients.id
)
on conflict (client_id) do nothing;
