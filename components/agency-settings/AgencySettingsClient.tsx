"use client";

import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { VerticalSettingsNav } from "@/components/settings/VerticalSettingsNav";
import { ClientAvatar } from "@/components/ClientAvatar";

type SettingsPayload = {
  settings: {
    id: string;
    agency_name: string | null;
    logo_url: string | null;
    default_response_time_limit_hours: number;
    default_currency: string;
    default_timezone: string;
    terms_url: string | null;
    privacy_url: string | null;
  };
  connections: {
    twilio: { configured: boolean; accountSidMasked: string | null; whatsappFrom: string | null };
    resend: { configured: boolean; fromEmail: string | null };
  };
};

type AdminRow = { id: string; name: string; email: string; is_active: boolean; created_at: string };

type MessageLogRow = {
  id: string;
  created_at: string;
  notification_type: string;
  channel: string;
  recipient_masked: string;
  status: string;
  error_message: string | null;
  error_code: string | null;
  template_key: string | null;
};

const TABS = [
  { id: "general", label: "General" },
  { id: "notifications", label: "Notifications" },
  { id: "team", label: "Agency team" },
  { id: "billing", label: "Billing" },
  { id: "legal", label: "Legal" },
];

export function AgencySettingsClient() {
  const [tab, setTab] = useState("general");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [savedGeneral, setSavedGeneral] = useState(false);
  const [data, setData] = useState<SettingsPayload | null>(null);
  const [admins, setAdmins] = useState<AdminRow[]>([]);

  const [form, setForm] = useState({
    agency_name: "",
    logo_url: "",
    default_response_time_limit_hours: 2,
    default_currency: "USD",
    default_timezone: "America/New_York",
    terms_url: "",
    privacy_url: "",
  });

  const [legalForm, setLegalForm] = useState({ terms_url: "", privacy_url: "" });

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [messageLogs, setMessageLogs] = useState<MessageLogRow[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [sRes, aRes] = await Promise.all([fetch("/api/agency/settings"), fetch("/api/agency/admins")]);
      const sJson = (await sRes.json()) as SettingsPayload;
      const aJson = (await aRes.json()) as { admins: AdminRow[] };
      if (sRes.ok) {
        setData(sJson);
        const st = sJson.settings;
        setForm({
          agency_name: st.agency_name ?? "",
          logo_url: st.logo_url ?? "",
          default_response_time_limit_hours: st.default_response_time_limit_hours,
          default_currency: st.default_currency,
          default_timezone: st.default_timezone,
          terms_url: st.terms_url ?? "",
          privacy_url: st.privacy_url ?? "",
        });
        setLegalForm({ terms_url: st.terms_url ?? "", privacy_url: st.privacy_url ?? "" });
      }
      if (aRes.ok) setAdmins(aJson.admins ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    if (tab !== "notifications") return;
    let cancelled = false;
    (async () => {
      setLogsLoading(true);
      try {
        const res = await fetch("/api/agency/message-logs");
        const j = (await res.json()) as { logs?: MessageLogRow[] };
        if (!cancelled && res.ok) setMessageLogs(j.logs ?? []);
      } finally {
        if (!cancelled) setLogsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tab]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(t);
  }, [toast]);

  async function saveGeneral() {
    setSaving(true);
    try {
      const res = await fetch("/api/agency/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agency_name: form.agency_name || null,
          logo_url: form.logo_url || null,
          default_response_time_limit_hours: form.default_response_time_limit_hours,
          default_currency: form.default_currency,
          default_timezone: form.default_timezone,
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "Save failed");
      setToast("Saved agency settings.");
      setSavedGeneral(true);
      window.setTimeout(() => setSavedGeneral(false), 2000);
      await load();
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Error");
    } finally {
      setSaving(false);
    }
  }

  async function saveLegal() {
    setSaving(true);
    try {
      const res = await fetch("/api/agency/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          terms_url: legalForm.terms_url || null,
          privacy_url: legalForm.privacy_url || null,
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "Save failed");
      setToast("Saved legal URLs.");
      await load();
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Error");
    } finally {
      setSaving(false);
    }
  }

  async function testNotification() {
    setSaving(true);
    try {
      const res = await fetch("/api/settings/test-notification", { method: "POST" });
      const j = (await res.json()) as { whatsapp?: string; email?: string; detail?: string };
      if (!res.ok) throw new Error((j as { error?: string }).error ?? "Failed");
      setToast(
        `Test: WhatsApp ${j.whatsapp ?? "?"}, Email ${j.email ?? "?"}` + (j.detail ? ` — ${j.detail}` : "")
      );
      const lr = await fetch("/api/agency/message-logs");
      if (lr.ok) {
        const lj = (await lr.json()) as { logs?: MessageLogRow[] };
        setMessageLogs(lj.logs ?? []);
      }
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Error");
    } finally {
      setSaving(false);
    }
  }

  async function sendInvite() {
    if (!inviteEmail.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/agency/invite-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim() }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "Invite failed");
      setTempPassword(j.temporaryPassword as string);
      setInviteOpen(false);
      setInviteEmail("");
      setToast("Admin user created.");
      await load();
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Error");
    } finally {
      setSaving(false);
    }
  }

  async function deactivateAdmin(id: string) {
    if (!window.confirm("Deactivate this admin? They will not be able to sign in.")) return;
    const res = await fetch(`/api/agency/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: false }),
    });
    if (!res.ok) {
      const j = await res.json();
      setToast(j.error ?? "Failed");
      return;
    }
    await load();
  }

  if (loading && !data) {
    return <div className="shimmer h-96 rounded-lg" />;
  }

  return (
    <div className="flex flex-col gap-6 pb-24 md:flex-row md:gap-10">
      <VerticalSettingsNav tabs={TABS} active={tab} onChange={setTab} />

      <div className="min-w-0 flex-1">
        {toast ? (
          <div className="mb-4 rounded-md border border-border bg-surface-card-alt px-3 py-2 text-sm text-ink-primary">
            {toast}
          </div>
        ) : null}

        {tab === "general" ? (
          <div className="space-y-6">
            <div>
              <h2 className="font-display text-2xl text-ink-primary">General</h2>
              <p className="mt-1 text-sm text-ink-secondary">Defaults for new clients and platform identity.</p>
            </div>
            <div className="grid max-w-lg gap-4">
              <label className="block">
                <span className="font-mono text-[10px] uppercase tracking-wide text-ink-tertiary">Agency name</span>
                <p className="mt-1 text-[12px] leading-snug text-[var(--text-tertiary)]">
                  Shown in the top-left of the platform and on client-facing emails.
                </p>
                <input
                  className="mt-2 w-full rounded-md border border-border bg-surface-card px-3 py-2 text-base md:text-sm"
                  value={form.agency_name}
                  onChange={(e) => setForm((f) => ({ ...f, agency_name: e.target.value }))}
                />
              </label>
              <label className="block">
                <span className="font-mono text-[10px] uppercase tracking-wide text-ink-tertiary">Logo URL</span>
                <p className="mt-1 text-[12px] leading-snug text-[var(--text-tertiary)]">Used in emails and branded surfaces when set.</p>
                <input
                  className="mt-2 w-full rounded-md border border-border bg-surface-card px-3 py-2 text-base md:text-sm"
                  value={form.logo_url}
                  onChange={(e) => setForm((f) => ({ ...f, logo_url: e.target.value }))}
                  placeholder="https://…"
                />
              </label>
              <label className="block">
                <span className="font-mono text-[10px] uppercase tracking-wide text-ink-tertiary">
                  Default response time (hours)
                </span>
                <p className="mt-1 text-[12px] leading-snug text-[var(--text-tertiary)]">
                  New clients inherit this SLA. Leads not contacted within this window get flagged.
                </p>
                <input
                  type="number"
                  min={1}
                  max={168}
                  className="mt-2 w-full rounded-md border border-border bg-surface-card px-3 py-2 text-base md:text-sm"
                  value={form.default_response_time_limit_hours}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, default_response_time_limit_hours: Number(e.target.value) || 2 }))
                  }
                />
              </label>
              <label className="block">
                <span className="font-mono text-[10px] uppercase tracking-wide text-ink-tertiary">Default currency</span>
                <p className="mt-1 text-[12px] leading-snug text-[var(--text-tertiary)]">
                  Used to format deal values across reports.
                </p>
                <input
                  className="mt-2 w-full rounded-md border border-border bg-surface-card px-3 py-2 text-base md:text-sm"
                  value={form.default_currency}
                  onChange={(e) => setForm((f) => ({ ...f, default_currency: e.target.value }))}
                />
              </label>
              <label className="block">
                <span className="font-mono text-[10px] uppercase tracking-wide text-ink-tertiary">Default timezone</span>
                <p className="mt-1 text-[12px] leading-snug text-[var(--text-tertiary)]">
                  Controls when daily cron jobs fire and how dates display.
                </p>
                <input
                  className="mt-2 w-full rounded-md border border-border bg-surface-card px-3 py-2 text-base md:text-sm"
                  value={form.default_timezone}
                  onChange={(e) => setForm((f) => ({ ...f, default_timezone: e.target.value }))}
                  placeholder="America/New_York"
                />
              </label>
            </div>
            <div className="safe-bottom sticky bottom-0 border-t border-border bg-[var(--surface-page)] pt-4">
              <div className="flex flex-wrap items-center gap-3">
                <button type="button" className="btn-primary h-11 md:h-9" disabled={saving} onClick={() => void saveGeneral()}>
                  {saving ? "Saving…" : "Save"}
                </button>
                {savedGeneral ? (
                  <span className="text-[13px] font-medium text-[var(--success)]" aria-live="polite">
                    Saved ✓
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}

        {tab === "notifications" ? (
          <div className="space-y-6">
            <h2 className="font-display text-2xl text-ink-primary">Notifications</h2>
            <p className="text-sm text-ink-secondary">
              Credentials are read from environment variables (Vercel → Project → Settings → Environment Variables). Do not
              paste secrets into this UI.
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-border bg-surface-card p-4">
                <div className="flex items-center gap-2">
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${data?.connections.twilio.configured ? "bg-emerald-500" : "bg-red-500"}`}
                  />
                  <div className="font-mono text-[10px] uppercase text-ink-tertiary">Twilio</div>
                </div>
                <p className="mt-2 text-sm">
                  <span className={data?.connections.twilio.configured ? "text-emerald-600" : "text-red-600"}>
                    {data?.connections.twilio.configured ? "Connected" : "Not configured"}
                  </span>
                </p>
                <p className="mt-1 font-mono text-xs text-ink-secondary">
                  Account SID: {data?.connections.twilio.accountSidMasked ?? "—"}
                </p>
                <p className="mt-1 font-mono text-xs text-ink-secondary">
                  WhatsApp From: {data?.connections.twilio.whatsappFrom ?? "—"}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-surface-card p-4">
                <div className="flex items-center gap-2">
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${data?.connections.resend.configured ? "bg-emerald-500" : "bg-red-500"}`}
                  />
                  <div className="font-mono text-[10px] uppercase text-ink-tertiary">Resend</div>
                </div>
                <p className="mt-2 text-sm">
                  <span className={data?.connections.resend.configured ? "text-emerald-600" : "text-red-600"}>
                    {data?.connections.resend.configured ? "Connected" : "Not configured"}
                  </span>
                </p>
                <p className="mt-1 font-mono text-xs text-ink-secondary">
                  From email: {data?.connections.resend.fromEmail ?? "—"}
                </p>
              </div>
            </div>
            <button type="button" className="btn-primary h-11 md:h-9" disabled={saving} onClick={() => void testNotification()}>
              Test notification
            </button>

            <div className="mt-10">
              <h3 className="font-display text-lg text-ink-primary">Recent notifications</h3>
              <p className="mt-1 text-sm text-ink-secondary">Last 20 outbound WhatsApp / email attempts (masked recipients).</p>
              {logsLoading ? (
                <p className="mt-4 text-sm text-ink-tertiary">Loading…</p>
              ) : messageLogs.length === 0 ? (
                <p className="mt-4 text-sm text-ink-tertiary">
                  No delivery rows yet. Apply the message_logs migration, then trigger a lead or test notification.
                </p>
              ) : (
                <div className="mt-4 overflow-x-auto rounded-lg border border-border">
                  <table className="w-full min-w-[640px] text-left text-sm">
                    <thead className="border-b border-border bg-surface-card-alt font-mono text-[10px] uppercase text-ink-tertiary">
                      <tr>
                        <th className="px-3 py-2">Time</th>
                        <th className="px-3 py-2">Type</th>
                        <th className="px-3 py-2">Channel</th>
                        <th className="px-3 py-2">Recipient</th>
                        <th className="px-3 py-2">Status</th>
                        <th className="px-3 py-2">Error</th>
                      </tr>
                    </thead>
                    <tbody>
                      {messageLogs.map((row) => (
                        <tr key={row.id} className="border-t border-border">
                          <td className="whitespace-nowrap px-3 py-2 text-xs text-ink-secondary">
                            {row.created_at ? format(parseISO(row.created_at), "MMM d, HH:mm") : "—"}
                          </td>
                          <td className="px-3 py-2 font-mono text-xs">{row.notification_type}</td>
                          <td className="px-3 py-2 text-xs">{row.channel}</td>
                          <td className="px-3 py-2 font-mono text-xs">{row.recipient_masked}</td>
                          <td className="px-3 py-2 text-xs">{row.status}</td>
                          <td className="max-w-[200px] truncate px-3 py-2 text-xs text-[var(--danger-fg)]" title={row.error_message ?? ""}>
                            {row.error_code ? `${row.error_code}: ` : ""}
                            {row.error_message ?? "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : null}

        {tab === "team" ? (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-2xl text-ink-primary">Agency team</h2>
              <button type="button" className="btn-ghost text-sm" onClick={() => setInviteOpen(true)}>
                Invite admin
              </button>
            </div>
            {tempPassword ? (
              <div className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm">
                Temporary password (copy now): <code className="font-mono">{tempPassword}</code>
                <button type="button" className="ml-2 underline" onClick={() => setTempPassword(null)}>
                  Dismiss
                </button>
              </div>
            ) : null}
            <div className="overflow-hidden rounded-lg border border-border">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-surface-card-alt font-mono text-[10px] uppercase text-ink-tertiary">
                  <tr>
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Joined</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {admins.map((a) => (
                    <tr key={a.id} className="border-t border-border">
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-2">
                          <ClientAvatar name={a.name} size="sm" />
                          <span className="font-medium">{a.name}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-ink-secondary">{a.email}</td>
                      <td className="px-4 py-3 text-xs text-ink-tertiary">
                        {a.created_at ? format(parseISO(a.created_at), "MMM d, yyyy") : "—"}
                      </td>
                      <td className="px-4 py-3">{a.is_active ? "Active" : "Inactive"}</td>
                      <td className="px-4 py-3 text-right">
                        {a.is_active ? (
                          <button
                            type="button"
                            className="text-sm text-[var(--danger-fg)] hover:underline"
                            onClick={() => void deactivateAdmin(a.id)}
                          >
                            Deactivate
                          </button>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {inviteOpen ? (
              <div className="fixed inset-0 z-50 flex flex-col bg-[var(--surface-overlay)] p-0 md:items-center md:justify-center md:p-4">
                <div className="flex h-full w-full flex-col border border-border bg-surface-card p-5 shadow-lg md:h-auto md:max-w-md md:rounded-lg md:p-6">
                  <h3 className="font-display text-xl">Invite agency admin</h3>
                  <label className="mt-4 block">
                    <span className="font-mono text-[10px] uppercase text-ink-tertiary">Email</span>
                    <input
                      className="mt-1 w-full rounded-md border border-border px-3 py-2 text-base md:text-sm"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      type="email"
                      inputMode="email"
                      autoCapitalize="off"
                    />
                  </label>
                  <div className="safe-bottom mt-auto flex justify-end gap-2 border-t border-border pt-4 md:mt-4 md:border-t-0 md:pt-0">
                    <button type="button" className="btn-ghost h-11 flex-1 md:h-9 md:flex-none" onClick={() => setInviteOpen(false)}>
                      Cancel
                    </button>
                    <button type="button" className="btn-primary h-11 flex-1 md:h-9 md:flex-none" disabled={saving} onClick={() => void sendInvite()}>
                      Send invite
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        {tab === "billing" ? (
          <div>
            <h2 className="font-display text-2xl text-ink-primary">Billing</h2>
            <p className="mt-4 text-ink-secondary">Billing settings coming soon. Stripe integration will live here.</p>
          </div>
        ) : null}

        {tab === "legal" ? (
          <div className="space-y-6">
            <h2 className="font-display text-2xl text-ink-primary">Legal</h2>
            <p className="text-sm text-ink-secondary">Shown in landing page footers (when set).</p>
            <div className="grid max-w-lg gap-4">
              <label className="block">
                <span className="font-mono text-[10px] uppercase tracking-wide text-ink-tertiary">Terms of Service URL</span>
                <input
                  className="mt-1 w-full rounded-md border border-border bg-surface-card px-3 py-2 text-sm"
                  value={legalForm.terms_url}
                  onChange={(e) => setLegalForm((f) => ({ ...f, terms_url: e.target.value }))}
                />
              </label>
              <label className="block">
                <span className="font-mono text-[10px] uppercase tracking-wide text-ink-tertiary">Privacy Policy URL</span>
                <input
                  className="mt-1 w-full rounded-md border border-border bg-surface-card px-3 py-2 text-sm"
                  value={legalForm.privacy_url}
                  onChange={(e) => setLegalForm((f) => ({ ...f, privacy_url: e.target.value }))}
                />
              </label>
            </div>
            <div className="safe-bottom sticky bottom-0 border-t border-border bg-[var(--surface-page)] pt-4">
              <button type="button" className="btn-primary h-11 md:h-9" disabled={saving} onClick={() => void saveLegal()}>
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
