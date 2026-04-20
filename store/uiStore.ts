import { create } from "zustand";

type LeadPanel = { open: boolean; leadId: string | null };

export const useLeadPanel = create<LeadPanel>(() => ({
  open: false,
  leadId: null,
}));

export function openLeadPanel(leadId: string) {
  useLeadPanel.setState({ open: true, leadId });
}

export function closeLeadPanel() {
  useLeadPanel.setState({ open: false, leadId: null });
}
