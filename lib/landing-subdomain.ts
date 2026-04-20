/** Display subdomain for landing (marketing). */
export function getLandingSubdomainLabel(slug: string): string {
  const raw = process.env.NEXT_PUBLIC_APP_DOMAIN ?? "localhost:3000";
  const host = raw.replace(/^https?:\/\//i, "").split("/")[0].split(":")[0];
  if (host === "localhost") return `${slug}.localhost`;
  const parts = host.split(".");
  if (parts.length >= 2) {
    const root = parts.slice(-2).join(".");
    return `${slug}.${root}`;
  }
  return `${slug}.${host}`;
}
