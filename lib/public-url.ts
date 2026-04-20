/** Public landing URL for a client slug (uses NEXT_PUBLIC_APP_DOMAIN). */
export function getPublicLandingPageUrl(slug: string): string {
  const raw = process.env.NEXT_PUBLIC_APP_DOMAIN ?? "localhost:3000";
  const origin = /^https?:\/\//i.test(raw) ? raw : `http://${raw}`;
  return `${origin.replace(/\/$/, "")}/p/${slug}`;
}
