-- Extend in-app notification types for client manager uncontacted alerts.
alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications add constraint notifications_type_check check (type in (
  'NEW_LEAD', 'FOLLOW_UP_DUE', 'DEAL_WON', 'LEAD_FLAG', 'UNCONTACTED_MANAGER_ALERT'
));

-- Backfill client managers with per-event × per-channel prefs on users.notification_prefs (JSONB).
-- Skips users who already have nested newLead object (granular shape).
update public.users
set notification_prefs = '{
  "newLead": {"whatsapp": true, "email": true},
  "dealWon": {"whatsapp": true, "email": true},
  "uncontactedLead": {"whatsapp": false, "email": false},
  "weeklyDigest": {"email": false}
}'::jsonb
where role = 'CLIENT_MANAGER'
  and (
    notification_prefs is null
    or not (notification_prefs ? 'newLead')
    or jsonb_typeof(notification_prefs->'newLead') = 'boolean'
  );
