export type ActivityEventKind =
  | "NEW_LEAD"
  | "DEAL_WON"
  | "FOLLOW_UP_SET"
  | "CONTACTED"
  | "NOT_QUALIFIED"
  | "FLAGGED";

export type ActivityEventDTO = {
  id: string;
  type: ActivityEventKind;
  timestamp: string;
  actorName: string | null;
  targetLeadName: string;
  clientName: string;
  message: string;
};
