-- Facebook Lead Ads: deduplicate webhook deliveries by Graph leadgen id
alter table public.leads
  add column if not exists facebook_lead_id text;

create unique index if not exists leads_facebook_lead_id_unique
  on public.leads (client_id, facebook_lead_id)
  where facebook_lead_id is not null;

create index if not exists leads_facebook_lead_id_lookup
  on public.leads (facebook_lead_id)
  where facebook_lead_id is not null;

comment on column public.leads.facebook_lead_id is 'Meta leadgen_id; unique per client for dedup.';
