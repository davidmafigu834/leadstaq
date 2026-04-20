import type { LandingFormState } from "@/lib/landing-types";

/** True when the page is still a blank slate (show template callout). */
export function isLandingMeaningfullyEmpty(row: Record<string, unknown> | LandingFormState): boolean {
  const r = row as Record<string, unknown>;
  const hero = String("hero_headline" in r ? r.hero_headline : (row as LandingFormState).hero_headline ?? "").trim();
  const about = String("about_text" in r ? r.about_text : (row as LandingFormState).about_text ?? "").trim();
  const svc = "services" in r ? r.services : (row as LandingFormState).services;
  const proj = "projects" in r ? r.projects : (row as LandingFormState).projects;
  const hasServices = Array.isArray(svc) && svc.length > 0;
  const hasProjects = Array.isArray(proj) && proj.length > 0;
  return !hero && !about && !hasServices && !hasProjects;
}

export function landingRowHasContent(row: Record<string, unknown> | null | undefined): boolean {
  if (!row) return false;
  return !isLandingMeaningfullyEmpty(row);
}
