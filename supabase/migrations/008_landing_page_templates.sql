-- Landing page templates + apply tracking on landing_pages

create table if not exists public.landing_page_templates (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null default '',
  industry text not null default 'general',
  style text not null default 'minimal',
  thumbnail_url text not null default '',
  preview_url text,
  is_premium boolean not null default false,
  is_published boolean not null default false,
  sort_order int not null default 0,
  hero_headline text,
  hero_subheadline text,
  hero_image_url text,
  hero_text_color text,
  hero_overlay_opacity int,
  cta_text text,
  about_company_name text,
  about_tagline text,
  about_text text,
  about_image_url text,
  about_stats jsonb default '[]'::jsonb,
  services jsonb default '[]'::jsonb,
  projects jsonb default '[]'::jsonb,
  testimonials jsonb default '[]'::jsonb,
  primary_color text,
  font_choice text,
  footer_contact text,
  footer_socials jsonb,
  footer_copyright text,
  section_order jsonb,
  section_visibility jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_landing_templates_industry on public.landing_page_templates (industry);
create index if not exists idx_landing_templates_style on public.landing_page_templates (style);
create index if not exists idx_landing_templates_published_sort on public.landing_page_templates (is_published, sort_order);

alter table public.landing_pages
  add column if not exists applied_template_id uuid references public.landing_page_templates (id) on delete set null,
  add column if not exists applied_template_at timestamptz,
  add column if not exists content_backup jsonb;

alter table public.landing_page_templates enable row level security;
