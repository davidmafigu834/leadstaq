import { isBefore, isToday, startOfDay } from "date-fns";

/** Lower number = higher position in column (overdue → today → rest). */
export type KanbanSortableLead = {
  follow_up_date: string | null;
  created_at: string;
};

export function kanbanPriority(lead: KanbanSortableLead): number {
  if (!lead.follow_up_date) return 2;
  const followUp = new Date(lead.follow_up_date);
  const startOfToday = startOfDay(new Date());
  if (isBefore(followUp, startOfToday)) return 0;
  if (isToday(followUp)) return 1;
  return 2;
}

export function sortKanbanLeads<T extends KanbanSortableLead>(leads: T[]): T[] {
  return [...leads].sort((a, b) => {
    const priorityDiff = kanbanPriority(a) - kanbanPriority(b);
    if (priorityDiff !== 0) return priorityDiff;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}
