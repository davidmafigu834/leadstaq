-- Facebook OAuth: token expiry, page name, connection audit
alter table public.clients
  add column if not exists fb_access_token_expires_at timestamptz,
  add column if not exists fb_page_name text,
  add column if not exists fb_connected_by_user_id uuid references public.users(id) on delete set null,
  add column if not exists fb_connected_at timestamptz;

comment on column public.clients.fb_access_token_expires_at is 'Long-lived user or page token expiry (from Graph expires_in)';
comment on column public.clients.fb_page_name is 'Selected Facebook Page name';
comment on column public.clients.fb_connected_by_user_id is 'Agency admin who completed OAuth';
comment on column public.clients.fb_connected_at is 'When Facebook OAuth completed';
