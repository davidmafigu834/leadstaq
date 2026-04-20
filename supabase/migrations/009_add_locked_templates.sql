-- Locked landing templates: JSON content/theme + template metadata

alter table public.landing_pages
  add column if not exists is_locked_template boolean not null default false,
  add column if not exists template_content jsonb,
  add column if not exists template_theme jsonb;

alter table public.landing_page_templates
  add column if not exists is_locked boolean not null default false,
  add column if not exists component_name text,
  add column if not exists content_schema jsonb,
  add column if not exists default_content jsonb,
  add column if not exists default_theme jsonb,
  add column if not exists editable_fields jsonb;

comment on column public.landing_pages.is_locked_template is 'When true, page uses template_content + template_theme and locked renderer.';
comment on column public.landing_pages.template_content is 'Template-specific JSON; shape depends on applied_template_id.';
comment on column public.landing_pages.template_theme is 'JSON { primary_color, ink_color, paper_color } for locked templates.';
comment on column public.landing_page_templates.is_locked is 'When true, apply copies default_content/theme instead of snapshot columns.';
comment on column public.landing_page_templates.component_name is 'Registry key e.g. NorthfieldConstruction.';
comment on column public.landing_page_templates.editable_fields is 'JSON array of field specs for locked template editor UI.';
