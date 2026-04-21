-- Outbound delivery audit (Twilio / Resend), separate from in-app notifications table.

create table if not exists public.message_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  lead_id uuid references public.leads(id) on delete set null,
  client_id uuid references public.clients(id) on delete set null,

  channel text not null check (channel in ('whatsapp', 'sms', 'email')),
  notification_type text not null,
  recipient text not null,
  template_key text,

  status text not null check (status in ('pending', 'sent', 'failed', 'delivered', 'read')),
  provider_id text,
  error_message text,
  error_code text,

  payload_preview text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists message_logs_lead_id on public.message_logs(lead_id);
create index if not exists message_logs_user_id_created_at on public.message_logs(user_id, created_at desc);
create index if not exists message_logs_status_created_at on public.message_logs(status, created_at desc);
create index if not exists message_logs_provider_id on public.message_logs(provider_id) where provider_id is not null;
