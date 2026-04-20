/**
 * Vercel Cron sends `Authorization: Bearer <CRON_SECRET>` when `CRON_SECRET` is set in project env.
 * External schedulers (e.g. cron-job.org) should use the same header. In development, auth is skipped.
 */
export function isAuthorizedCronRequest(req: Request): boolean {
  if (process.env.NODE_ENV === "development") {
    return true;
  }
  const secret = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  return Boolean(process.env.CRON_SECRET && secret === process.env.CRON_SECRET);
}
