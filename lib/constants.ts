export const APP_NAME = "Leadstaq";

export function getPublicBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  if (process.env.NEXTAUTH_URL) return process.env.NEXTAUTH_URL.replace(/\/$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  if (typeof window !== "undefined" && window.location?.origin) return window.location.origin.replace(/\/$/, "");
  return "http://localhost:3000";
}

export function getAppDomain(): string {
  return process.env.NEXT_PUBLIC_APP_DOMAIN || "localhost:3000";
}

export function magicLinkUrl(token: string): string {
  return `${getPublicBaseUrl()}/lead/${token}`;
}
