-- =============================================================
-- 016_project_media_infrastructure.sql
-- Core cloud tables: projects, project_media, client_profiles,
-- testimonials, form_steps, form_fields
-- Written from live schema inspection — 2026-05-08
-- =============================================================

-- ========================
-- PROJECTS
-- ========================
create table if not exists public.projects (
  id               uuid        primary key default gen_random_uuid(),
  client_id        uuid        not null references public.clients(id) on delete cascade,
  title            text        not null,
  slug             text,
  category         text,
  location         text,
  description      text,
  completion_date  date,
  is_featured      boolean     not null default false,
  is_public        boolean     not null default true,
  display_order    integer     not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists idx_projects_client_id
  on public.projects(client_id);

create index if not exists idx_projects_client_display_order
  on public.projects(client_id, display_order);

alter table public.projects enable row level security;

-- Auto-generate a URL-safe slug from the title on insert
create or replace function public.projects_set_slug()
returns trigger language plpgsql as $$
declare
  base_slug  text;
  suffix     text;
begin
  if new.slug is null or new.slug = '' then
    base_slug := lower(regexp_replace(new.title, '[^a-zA-Z0-9]+', '-', 'g'));
    base_slug := trim(both '-' from base_slug);
    suffix    := substr(replace(gen_random_uuid()::text, '-', ''), 1, 6);
    new.slug  := base_slug || '-' || suffix;
  end if;
  return new;
end;
$$;

create trigger projects_slug_trigger
  before insert on public.projects
  for each row execute procedure public.projects_set_slug();

-- ========================
-- PROJECT_MEDIA
-- ========================
create table if not exists public.project_media (
  id               uuid        primary key default gen_random_uuid(),
  project_id       uuid        not null references public.projects(id) on delete cascade,
  client_id        uuid        not null references public.clients(id) on delete cascade,
  type             text        not null default 'photo',
  storage_key      text        not null,
  public_url       text        not null,
  caption          text,
  file_size_bytes  bigint,
  display_order    integer     not null default 0,
  created_at       timestamptz not null default now()
);

create index if not exists idx_project_media_project_id
  on public.project_media(project_id);

create index if not exists idx_project_media_client_id
  on public.project_media(client_id);

create index if not exists idx_project_media_project_display_order
  on public.project_media(project_id, display_order);

alter table public.project_media enable row level security;

-- ========================
-- CLIENT_PROFILES
-- ========================
-- Note: watermark_enabled, watermark_position, watermark_opacity, watermark_size
-- are added later by migration 018 and must NOT appear here.
create table if not exists public.client_profiles (
  id              uuid        primary key default gen_random_uuid(),
  client_id       uuid        not null unique references public.clients(id) on delete cascade,
  slug            text        unique,
  headline        text,
  subheadline     text,
  hero_image_url  text,
  hero_image_key  text,
  cta_text        text,
  form_title      text,
  is_published    boolean     not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_client_profiles_slug
  on public.client_profiles(slug);

alter table public.client_profiles enable row level security;

-- ========================
-- TESTIMONIALS
-- ========================
create table if not exists public.testimonials (
  id             uuid        primary key default gen_random_uuid(),
  client_id      uuid        not null references public.clients(id) on delete cascade,
  author_name    text        not null,
  author_role    text,
  content        text        not null,
  rating         integer     check (rating between 1 and 5),
  photo_url      text,
  video_url      text,
  is_featured    boolean     not null default false,
  display_order  integer     not null default 0,
  created_at     timestamptz not null default now()
);

create index if not exists idx_testimonials_client_id
  on public.testimonials(client_id);

alter table public.testimonials enable row level security;

-- ========================
-- FORM_STEPS
-- ========================
create table if not exists public.form_steps (
  id           uuid        primary key default gen_random_uuid(),
  client_id    uuid        not null references public.clients(id) on delete cascade,
  step_number  integer     not null,
  title        text        not null,
  created_at   timestamptz not null default now()
);

create index if not exists idx_form_steps_client_id
  on public.form_steps(client_id);

alter table public.form_steps enable row level security;

-- ========================
-- FORM_FIELDS
-- ========================
create table if not exists public.form_fields (
  id             uuid        primary key default gen_random_uuid(),
  step_id        uuid        not null references public.form_steps(id) on delete cascade,
  client_id      uuid        not null references public.clients(id) on delete cascade,
  field_type     text        not null,
  label          text        not null,
  placeholder    text,
  options        jsonb,
  is_required    boolean     not null default false,
  maps_to        text,
  display_order  integer     not null default 0,
  created_at     timestamptz not null default now()
);

create index if not exists idx_form_fields_step_id
  on public.form_fields(step_id);

create index if not exists idx_form_fields_client_id
  on public.form_fields(client_id);

alter table public.form_fields enable row level security;
