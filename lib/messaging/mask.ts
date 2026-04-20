/** Mask phone or email for admin UI (privacy). */
export function maskRecipient(raw: string): string {
  const s = raw.trim();
  if (!s) return "—";
  if (s.includes("@")) {
    const [local, domain] = s.split("@");
    if (!domain) return "***";
    const keep = Math.min(2, local.length);
    return `${local.slice(0, keep)}***@${domain}`;
  }
  if (s.startsWith("+") && s.length > 8) {
    return `${s.slice(0, 5)}***${s.slice(-3)}`;
  }
  if (s.length > 6) {
    return `${s.slice(0, 3)}***${s.slice(-2)}`;
  }
  return "***";
}
