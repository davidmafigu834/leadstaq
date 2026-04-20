-- Add lost_reason on leads; allow LOST on call_logs outcomes

alter table public.leads add column if not exists lost_reason text;

alter table public.call_logs drop constraint if exists call_logs_outcome_check;
alter table public.call_logs add constraint call_logs_outcome_check check (outcome in (
  'ANSWERED', 'NO_ANSWER', 'FOLLOW_UP', 'WON', 'LOST', 'NOT_QUALIFIED'
));
