-- Facebook: timestamp when Graph last reported token expiry (drives UI + alert dedup)
alter table public.clients
  add column if not exists fb_token_expired_at timestamptz;

comment on column public.clients.fb_token_expired_at is 'Set when Graph returns OAuth token expiry; cleared on successful OAuth reconnect.';
