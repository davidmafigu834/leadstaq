-- 020_billing_period.sql
-- Add billing_period column to clients table
-- Tracks whether the client is on monthly or annual billing

alter table clients add column if not exists
  billing_period text default 'monthly'
  check (billing_period in ('monthly', 'annual'));
