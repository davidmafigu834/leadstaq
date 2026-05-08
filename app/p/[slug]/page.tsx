import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import Link from "next/link";
import { MapPin, Calendar, ArrowRight } from "lucide-react";
import { ProfilePageForm } from "./ProfilePageForm";
import { getCategoryStyle } from "@/app/cloud/lib/category-styles";

function getInitials(name: string): string {
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length >= 2) return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

export const dynamic = "force-dynamic";

type ProjectMedia = { public_url: string; display_order: number };
type Project = {
  id: string;
  slug: string;
  title: string;
  category: string | null;
  location: string | null;
  completion_date: string | null;
  description: string | null;
  project_media: ProjectMedia[];
};
type Testimonial = {
  id: string;
  author_name: string;
  author_role: string | null;
  content: string;
  rating: number | null;
  photo_url: string | null;
};
type FormFieldDef = {
  id: string;
  field_type: string;
  label: string;
  placeholder: string | null;
  options: string[] | null;
  is_required: boolean | null;
  maps_to: string | null;
  display_order: number | null;
};
type FormStepDef = { id: string; step_number: number; title: string; form_fields: FormFieldDef[] };

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const supabase = createAdminClient();
  const { data: profile } = await supabase
    .from("client_profiles")
    .select("headline, subheadline, hero_image_url, clients(name)")
    .eq("slug", params.slug)
    .maybeSingle();
  if (!profile) return { title: "Leadstaq" };
  const clientName = (profile.clients as { name?: string } | null)?.name ?? "Company";
  const title = (profile.headline as string | null) ?? clientName;
  const description = (profile.subheadline as string | null) ?? undefined;
  const heroImg = profile.hero_image_url as string | null;
  return {
    title,
    description,
    openGraph: { title, description, images: heroImg ? [{ url: heroImg }] : [] },
  };
}

export default async function ProfilePage({ params }: { params: { slug: string } }) {
  const supabase = createAdminClient();

  const { data: profile } = await supabase
    .from("client_profiles")
    .select("*, clients(id, name, slug, logo_url, primary_color)")
    .eq("slug", params.slug)
    .maybeSingle();

  if (!profile) notFound();

  if (!profile.is_published) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-gray-500">This page is not published yet.</p>
      </div>
    );
  }

  const clientId = profile.client_id as string;
  const client = profile.clients as { id: string; name: string; slug: string; logo_url: string | null; primary_color: string | null } | null;
  const clientName = client?.name ?? "Company";
  const accentColor = client?.primary_color ?? "#D4FF4F";
  const ctaText = (profile.cta_text as string | null) ?? "Get a Free Quote";
  const formTitle = (profile.form_title as string | null) ?? "Start Your Project";

  const [{ data: projects }, { data: testimonials }, { data: formSteps }] = await Promise.all([
    supabase
      .from("projects")
      .select("id, slug, title, category, location, completion_date, description, project_media(public_url, display_order)")
      .eq("client_id", clientId)
      .eq("is_featured", true)
      .eq("is_public", true)
      .order("display_order", { ascending: true })
      .limit(6),
    supabase
      .from("testimonials")
      .select("id, author_name, author_role, content, rating, photo_url")
      .eq("client_id", clientId)
      .order("display_order", { ascending: true }),
    supabase
      .from("form_steps")
      .select("id, step_number, title, form_fields(id, field_type, label, placeholder, options, is_required, maps_to, display_order)")
      .eq("client_id", clientId)
      .order("step_number", { ascending: true }),
  ]);

  const typedProjects = (projects ?? []) as unknown as Project[];
  const typedTestimonials = (testimonials ?? []) as unknown as Testimonial[];
  const typedFormSteps = (formSteps ?? []) as unknown as FormStepDef[];

  const firstProjectCover = typedProjects[0]?.project_media
    ? [...typedProjects[0].project_media].sort((a, b) => a.display_order - b.display_order)[0]?.public_url ?? null
    : null;
  const heroImageUrl = (profile.hero_image_url as string | null) ?? firstProjectCover;

  return (
    <div style={{ fontFamily: "var(--fw-font-body), system-ui, sans-serif" }}>

      {/* ── Section 1: Hero ── */}
      <section style={{ width: "100%", height: "clamp(320px, 50vw, 480px)", position: "relative", overflow: "hidden", background: "#1C1410" }}>
        {heroImageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={heroImageUrl}
            alt={clientName}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }}
          />
        )}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(28,20,16,0.92) 0%, rgba(28,20,16,0.4) 60%, rgba(28,20,16,0.2) 100%)" }} />
        <div style={{ position: "absolute", bottom: 36, left: "clamp(20px, 5vw, 60px)", right: "clamp(20px, 5vw, 60px)", maxWidth: 640 }}>
          <p style={{ fontFamily: "var(--fw-font-body), system-ui, sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.5)", margin: "0 0 10px" }}>
            {clientName}
          </p>
          <h1 style={{ fontFamily: "var(--fw-font-display), Georgia, serif", fontSize: "clamp(28px, 5vw, 52px)", color: "#FFFFFF", margin: "0 0 14px", lineHeight: 1.1, letterSpacing: "-0.01em" }}>
            {(profile.headline as string | null) ?? clientName}
          </h1>
          {profile.subheadline && (
            <p style={{ fontFamily: "var(--fw-font-body), system-ui, sans-serif", fontSize: 16, color: "rgba(255,255,255,0.65)", margin: "0 0 24px", lineHeight: 1.6, maxWidth: 500 }}>
              {profile.subheadline as string}
            </p>
          )}
          <a href="#contact" style={{ display: "inline-flex", alignItems: "center", gap: 8, height: 50, padding: "0 24px", background: "#D4FF4F", color: "#1C1410", borderRadius: 14, fontSize: 14, fontWeight: 700, fontFamily: "var(--fw-font-body), system-ui, sans-serif", textDecoration: "none" }}>
            {ctaText}
            <ArrowRight size={15} />
          </a>
        </div>
      </section>

      {/* ── Section 2: Featured Projects ── */}
      {typedProjects.length > 0 && (
        <section style={{ background: "#F7F4EF", padding: "clamp(40px, 6vw, 72px) clamp(20px, 5vw, 60px)" }}>
          <div style={{ marginBottom: 32 }}>
            <p style={{ fontFamily: "var(--fw-font-body), system-ui, sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#8C7B6B", margin: "0 0 8px" }}>
              Our Work
            </p>
            <h2 style={{ fontFamily: "var(--fw-font-display), Georgia, serif", fontSize: "clamp(24px, 4vw, 38px)", color: "#1C1410", margin: 0, lineHeight: 1.15 }}>
              Projects we&apos;re proud of
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16, maxWidth: 1100 }}>
            {typedProjects.map((project) => {
              const cat = getCategoryStyle(project.category);
              const sortedMedia = [...project.project_media].sort((a, b) => a.display_order - b.display_order);
              const coverUrl = sortedMedia[0]?.public_url;
              const photoCount = project.project_media.length;
              const showDesc = project.description && project.description.trim() !== "" && project.description.trim() !== "Everything";
              return (
                <Link key={project.id} href={`/cloud/share/${project.id}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                  <div style={{ background: "#FFFFFF", borderRadius: 18, border: "0.5px solid rgba(28,20,16,0.08)", overflow: "hidden" }}>
                    <div style={{ height: 220, background: cat.sceneBg, position: "relative", overflow: "hidden" }}>
                      {coverUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={coverUrl} alt={project.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                      )}
                      <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to top, ${cat.overlayFrom} 0%, transparent 55%)` }} />
                      {project.category && (
                        <span style={{ position: "absolute", top: 12, left: 12, background: cat.badge, color: cat.labelColor, fontSize: 9, fontWeight: 700, padding: "3px 9px", borderRadius: 20, letterSpacing: "0.04em", textTransform: "uppercase", fontFamily: "var(--fw-font-body), system-ui, sans-serif" }}>
                          {project.category}
                        </span>
                      )}
                      {photoCount > 0 && (
                        <span style={{ position: "absolute", top: 12, right: 12, background: "#D4FF4F", color: "#1C1410", fontSize: 9, fontWeight: 700, padding: "3px 8px", borderRadius: 20, fontFamily: "var(--fw-font-body), system-ui, sans-serif" }}>
                          {photoCount} {photoCount === 1 ? "photo" : "photos"}
                        </span>
                      )}
                    </div>
                    <div style={{ padding: "16px 18px 18px" }}>
                      <h3 style={{ fontFamily: "var(--fw-font-display), Georgia, serif", fontSize: 18, color: "#1C1410", margin: "0 0 6px", lineHeight: 1.2 }}>
                        {project.title}
                      </h3>
                      {showDesc && (
                        <p className="line-clamp-2" style={{ fontFamily: "var(--fw-font-body), system-ui, sans-serif", fontSize: 13, color: "#8C7B6B", margin: "0 0 12px", lineHeight: 1.5 }}>
                          {project.description}
                        </p>
                      )}
                      <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 12, color: "#8C7B6B", fontFamily: "var(--fw-font-body), system-ui, sans-serif" }}>
                        {project.location && (
                          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <MapPin size={12} color="#8C7B6B" />{project.location}
                          </span>
                        )}
                        {project.completion_date && (
                          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <Calendar size={12} color="#8C7B6B" />{formatDate(project.completion_date)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Section 3: Testimonials ── */}
      {typedTestimonials.length > 0 && (
        <section style={{ background: "#FFFFFF", padding: "clamp(40px, 6vw, 72px) clamp(20px, 5vw, 60px)" }}>
          <p style={{ fontFamily: "var(--fw-font-body), system-ui, sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#8C7B6B", margin: "0 0 8px" }}>
            What clients say
          </p>
          <h2 style={{ fontFamily: "var(--fw-font-display), Georgia, serif", fontSize: "clamp(22px, 3.5vw, 34px)", color: "#1C1410", margin: "0 0 32px", lineHeight: 1.2 }}>
            Trusted by our clients
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16, maxWidth: 900 }}>
            {typedTestimonials.map((t) => (
              <div key={t.id} style={{ background: "#F7F4EF", borderRadius: 16, border: "0.5px solid rgba(28,20,16,0.07)", padding: 24 }}>
                {t.rating != null && (
                  <div style={{ display: "flex", gap: 3, marginBottom: 14 }}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill={i < t.rating! ? "#C49A3C" : "none"} stroke={i < t.rating! ? "#C49A3C" : "#D1C8BE"} strokeWidth="1.5">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    ))}
                  </div>
                )}
                <p style={{ fontFamily: "var(--fw-font-body), system-ui, sans-serif", fontSize: 15, color: "#1C1410", lineHeight: 1.65, margin: "0 0 20px", fontStyle: "italic" }}>
                  &ldquo;{t.content}&rdquo;
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {t.photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={t.photo_url} alt={t.author_name} style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#1C1410", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#D4FF4F", fontFamily: "var(--fw-font-body), system-ui, sans-serif", flexShrink: 0 }}>
                      {getInitials(t.author_name)}
                    </div>
                  )}
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#1C1410", margin: 0, fontFamily: "var(--fw-font-body), system-ui, sans-serif" }}>{t.author_name}</p>
                    {t.author_role && (
                      <p style={{ fontSize: 11, color: "#8C7B6B", margin: 0, fontFamily: "var(--fw-font-body), system-ui, sans-serif" }}>{t.author_role}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Section 4: Contact form ── */}
      <section id="contact" style={{ background: "#F7F4EF", padding: "clamp(40px, 6vw, 72px) clamp(20px, 5vw, 60px)" }}>
        <div style={{ maxWidth: 580, margin: "0 auto" }}>
          <p style={{ fontFamily: "var(--fw-font-body), system-ui, sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#8C7B6B", margin: "0 0 8px" }}>
            Get in touch
          </p>
          <h2 style={{ fontFamily: "var(--fw-font-display), Georgia, serif", fontSize: "clamp(24px, 4vw, 38px)", color: "#1C1410", margin: "0 0 8px", lineHeight: 1.2 }}>
            {formTitle}
          </h2>
          <p style={{ fontFamily: "var(--fw-font-body), system-ui, sans-serif", fontSize: 14, color: "#8C7B6B", margin: "0 0 32px", lineHeight: 1.6 }}>
            Fill in a few details and we&apos;ll be in touch within the hour.
          </p>
          <div style={{ background: "#FFFFFF", borderRadius: 20, border: "0.5px solid rgba(28,20,16,0.08)", padding: "clamp(24px, 4vw, 40px)" }}>
            <ProfilePageForm
              clientId={clientId}
              accentColor={accentColor}
              ctaText={ctaText}
              formSteps={typedFormSteps}
            />
          </div>
        </div>
      </section>

      {/* ── Section 5: Footer ── */}
      <footer style={{ background: "#1C1410", padding: "20px clamp(20px, 5vw, 60px)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <p style={{ fontFamily: "var(--fw-font-body), system-ui, sans-serif", fontSize: 12, color: "rgba(255,255,255,0.3)", margin: 0 }}>
          {clientName}
        </p>
        <p style={{ fontFamily: "var(--fw-font-body), system-ui, sans-serif", fontSize: 12, color: "rgba(255,255,255,0.25)", margin: 0 }}>
          Powered by{" "}
          <a href="https://leadstaq.tech" target="_blank" rel="noopener noreferrer" style={{ color: "rgba(212,255,79,0.45)", textDecoration: "none" }}>
            Leadstaq
          </a>
        </p>
      </footer>
    </div>
  );
}
