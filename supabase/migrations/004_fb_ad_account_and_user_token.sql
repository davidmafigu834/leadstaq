-- Marketing API: ad account id + preserve user token when page token replaces fb_access_token
alter table public.clients
  add column if not exists fb_ad_account_id text;

alter table public.clients
  add column if not exists fb_user_access_token text;

comment on column public.clients.fb_ad_account_id is 'Facebook Ads account id, e.g. act_123456789';
comment on column public.clients.fb_user_access_token is 'Long-lived user access token for Marketing API (not replaced by page token)';
