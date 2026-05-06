import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Star, MapPin, Calendar, ArrowRight } from "lucide-react";
import { ProfilePageForm } from "./ProfilePageForm";

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

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Hero */}
      <section className="relative flex min-h-[88vh] items-center overflow-hidden bg-gray-950">
        {profile.hero_image_url && (
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${profile.hero_image_url as string})`, opacity: 0.28 }}
          />
        )}
        <div className="relative mx-auto w-full max-w-7xl px-6 py-28 lg:px-10 lg:py-40">
          <div className="max-w-2xl">
            <p className="mb-4 font-mono text-xs uppercase tracking-[0.22em] text-white/50">{clientName}</p>
            <h1 className="mb-6 text-5xl font-light leading-[1.08] tracking-tight text-white lg:text-6xl">
              {(profile.headline as string | null) ?? clientName}
            </h1>
            {profile.subheadline && (
              <p className="mb-10 text-lg leading-relaxed text-white/70">{profile.subheadline as string}</p>
            )}
            <a
              href="#contact"
              className="inline-flex items-center gap-2.5 rounded-sm px-8 py-4 text-sm font-semibold transition-opacity hover:opacity-90"
              style={{ backgroundColor: accentColor, color: "#0a0a0a" }}
            >
              {ctaText}
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      {/* Featured Projects */}
      {typedProjects.length > 0 && (
        <section className="py-24 lg:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-10">
            <div className="mb-14">
              <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.18em] text-gray-400">Our Work</p>
              <h2 className="text-4xl font-light tracking-tight text-gray-900">Projects we&apos;re proud of</h2>
            </div>
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {typedProjects.map((project) => {
                const sortedMedia = [...project.project_media].sort((a, b) => a.display_order - b.display_order);
                const coverUrl = sortedMedia[0]?.public_url;
                return (
                  <Link
                    key={project.id}
                    href={`/share/projects/${project.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-lg"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                      {coverUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={coverUrl}
                          alt={project.title}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-gray-300">
                          <svg className="h-14 w-14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          </svg>
                        </div>
                      )}
                      {project.category && (
                        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-gray-700 backdrop-blur-sm">
                          {project.category}
                        </span>
                      )}
                    </div>
                    <div className="p-5">
                      <h3 className="mb-2 font-semibold text-gray-900 group-hover:text-gray-600">{project.title}</h3>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
                        {project.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />{project.location}
                          </span>
                        )}
                        {project.completion_date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(project.completion_date).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                          </span>
                        )}
                      </div>
                      {project.description && (
                        <p className="mt-2 line-clamp-2 text-sm text-gray-500">{project.description}</p>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Testimonials */}
      {typedTestimonials.length > 0 && (
        <section className="bg-gray-50 py-24 lg:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-10">
            <div className="mb-14">
              <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.18em] text-gray-400">Reviews</p>
              <h2 className="text-4xl font-light tracking-tight text-gray-900">What our clients say</h2>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {typedTestimonials.map((t) => (
                <div key={t.id} className="rounded-xl bg-white p-7 shadow-sm">
                  {t.rating != null && (
                    <div className="mb-4 flex gap-0.5">
                      {Array.from({ length: t.rating }).map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                  )}
                  <p className="mb-5 text-[15px] leading-relaxed text-gray-700">&ldquo;{t.content}&rdquo;</p>
                  <div className="flex items-center gap-3">
                    {t.photo_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={t.photo_url} alt={t.author_name} className="h-10 w-10 rounded-full object-cover" />
                    )}
                    <div>
                      <p className="font-semibold text-gray-900">{t.author_name}</p>
                      {t.author_role && <p className="text-sm text-gray-500">{t.author_role}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Multi-step form */}
      <section id="contact" className="py-24 lg:py-32">
        <div className="mx-auto max-w-xl px-6 lg:px-10">
          <div className="mb-10">
            <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.18em] text-gray-400">Get in touch</p>
            <h2 className="text-4xl font-light tracking-tight text-gray-900">{formTitle}</h2>
            <p className="mt-3 text-gray-500">Fill in a few details and we&apos;ll be in touch within the hour.</p>
          </div>
          <ProfilePageForm
            clientId={clientId}
            accentColor={accentColor}
            ctaText={ctaText}
            formSteps={typedFormSteps}
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-10">
        <div className="mx-auto max-w-7xl px-6 text-center text-sm text-gray-400 lg:px-10">
          <p>
            {clientName} &middot;{" "}
            <a
              href="https://leadstaq.tech"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-600"
            >
              Powered by Leadstaq
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
