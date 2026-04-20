-- Extend in-app notification types + optional client scope for deep links.
alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications add constraint notifications_type_check check (type in (
  'NEW_LEAD', 'FOLLOW_UP_DUE', 'DEAL_WON', 'LEAD_FLAG', 'UNCONTACTED_MANAGER_ALERT',
  'FB_TOKEN_EXPIRED', 'BACKFILL_COMPLETE'
));

alter table public.notifications add column if not exists client_id uuid references public.clients(id) on delete set null;

create index if not exists idx_notifications_client_id on public.notifications(client_id) where client_id is not null;
