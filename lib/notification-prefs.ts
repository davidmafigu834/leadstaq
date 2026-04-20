export type SalesNotificationPrefs = {
  whatsapp: boolean;
  email: boolean;
  followUpReminders: boolean;
};

/** Per-event × per-channel prefs for CLIENT_MANAGER (stored on users.notification_prefs). */
export type ManagerNotificationPrefs = {
  newLead: { whatsapp: boolean; email: boolean };
  dealWon: { whatsapp: boolean; email: boolean };
  uncontactedLead: { whatsapp: boolean; email: boolean };
  /** Email-only; digest delivery is not implemented yet — toggles are stored but send is a no-op. */
  weeklyDigest: { email: boolean };
};

const DEFAULT_SALES: SalesNotificationPrefs = {
  whatsapp: true,
  email: true,
  followUpReminders: true,
};

export const DEFAULT_MANAGER_PREFS: ManagerNotificationPrefs = {
  newLead: { whatsapp: true, email: true },
  dealWon: { whatsapp: true, email: true },
  uncontactedLead: { whatsapp: false, email: false },
  weeklyDigest: { email: false },
};

export function parseSalesPrefs(raw: unknown): SalesNotificationPrefs {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_SALES };
  const o = raw as Record<string, unknown>;
  return {
    whatsapp: typeof o.whatsapp === "boolean" ? o.whatsapp : DEFAULT_SALES.whatsapp,
    email: typeof o.email === "boolean" ? o.email : DEFAULT_SALES.email,
    followUpReminders:
      typeof o.followUpReminders === "boolean" ? o.followUpReminders : DEFAULT_SALES.followUpReminders,
  };
}

function isNestedChannelPrefs(v: unknown): v is { whatsapp: boolean; email: boolean } {
  return (
    v != null &&
    typeof v === "object" &&
    "whatsapp" in (v as object) &&
    "email" in (v as object) &&
    typeof (v as { whatsapp: unknown }).whatsapp === "boolean" &&
    typeof (v as { email: unknown }).email === "boolean"
  );
}

/** Parses manager notification_prefs JSONB; defaults nested booleans when missing. */
export function getManagerPrefs(raw: unknown): ManagerNotificationPrefs {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_MANAGER_PREFS };
  const o = raw as Record<string, unknown>;

  const nl = o.newLead;
  const dw = o.dealWon;
  const uc = o.uncontactedLead;
  const wd = o.weeklyDigest;

  return {
    newLead: isNestedChannelPrefs(nl)
      ? { whatsapp: nl.whatsapp, email: nl.email }
      : { whatsapp: DEFAULT_MANAGER_PREFS.newLead.whatsapp, email: DEFAULT_MANAGER_PREFS.newLead.email },
    dealWon: isNestedChannelPrefs(dw)
      ? { whatsapp: dw.whatsapp, email: dw.email }
      : { whatsapp: DEFAULT_MANAGER_PREFS.dealWon.whatsapp, email: DEFAULT_MANAGER_PREFS.dealWon.email },
    uncontactedLead: isNestedChannelPrefs(uc)
      ? { whatsapp: uc.whatsapp, email: uc.email }
      : { whatsapp: DEFAULT_MANAGER_PREFS.uncontactedLead.whatsapp, email: DEFAULT_MANAGER_PREFS.uncontactedLead.email },
    weeklyDigest:
      wd && typeof wd === "object" && typeof (wd as { email?: unknown }).email === "boolean"
        ? { email: (wd as { email: boolean }).email }
        : { email: DEFAULT_MANAGER_PREFS.weeklyDigest.email },
  };
}
