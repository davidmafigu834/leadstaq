-- Landing page builder: new columns, about_stats as JSONB, storage bucket, backfill

insert into storage.buckets (id, name, public)
values ('landing-page-images', 'landing-page-images', true)
on conflict (id) do nothing;

drop policy if exists "landing_page_images_public_read" on storage.objects;
create policy "landing_page_images_public_read"
  on storage.objects for select
  using (bucket_id = 'landing-page-images');

alter table public.landing_pages
  add column if not exists seo_title text,
  add column if not exists seo_description text,
  add column if not exists og_image_url text,
  add column if not exists section_order jsonb default '["hero","about","services","projects","testimonials","footer"]'::jsonb,
  add column if not exists section_visibility jsonb default '{"hero":true,"about":true,"services":true,"projects":true,"testimonials":true,"footer":true}'::jsonb,
  add column if not exists hero_text_color text default 'light',
  add column if not exists hero_overlay_opacity int default 40,
  add column if not exists footer_socials jsonb default '{"enabled":false,"facebook":"","instagram":"","linkedin":"","youtube":""}'::jsonb;

-- Normalize about_stats to jsonb (safe whether column was text or already jsonb).
-- Avoids a DO/DECLARE block so runners that split on ";" cannot break the script.
alter table public.landing_pages
  alter column about_stats type jsonb using (
    case
      when pg_typeof(about_stats) = 'jsonb'::regtype then coalesce(about_stats::jsonb, '[]'::jsonb)
      when about_stats is null or btrim(about_stats::text) = '' then '[]'::jsonb
      when left(btrim(about_stats::text), 1) = '[' then btrim(about_stats::text)::jsonb
      else jsonb_build_array(jsonb_build_object('label', '', 'value', btrim(about_stats::text)))
    end
  );

update public.landing_pages
set
  section_order = coalesce(section_order, '["hero","about","services","projects","testimonials","footer"]'::jsonb),
  section_visibility = coalesce(
    section_visibility,
    '{"hero":true,"about":true,"services":true,"projects":true,"testimonials":true,"footer":true}'::jsonb
  ),
  hero_text_color = coalesce(hero_text_color, 'light'),
  hero_overlay_opacity = coalesce(hero_overlay_opacity, 40),
  primary_color = case when primary_color is null or trim(primary_color) = '' then '#D4FF4F' else primary_color end,
  font_choice = case when font_choice is null or trim(font_choice) = '' then 'instrument-serif' else font_choice end,
  footer_socials = coalesce(
    footer_socials,
    '{"enabled":false,"facebook":"","instagram":"","linkedin":"","youtube":""}'::jsonb
  ),
  services = coalesce(services, '[]'::jsonb),
  projects = coalesce(projects, '[]'::jsonb),
  testimonials = coalesce(testimonials, '[]'::jsonb),
  about_stats = coalesce(about_stats, '[]'::jsonb)
where true;
