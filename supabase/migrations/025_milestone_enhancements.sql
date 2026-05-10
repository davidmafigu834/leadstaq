-- 025_milestone_enhancements.sql
-- Add human stats and before/during/after phase to milestones

alter table project_milestones
  add column if not exists stat_number text;

alter table project_milestones
  add column if not exists stat_label text;

alter table project_milestones
  add column if not exists phase text
  check (phase in ('before', 'during', 'after') or phase is null);

alter table projects
  add column if not exists duration_label text;

alter table projects
  add column if not exists budget_range text;

alter table projects
  add column if not exists show_budget boolean default false;
