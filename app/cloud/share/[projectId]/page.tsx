import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, Calendar, CloudUpload } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

type MediaItem = { id: string; public_url: string; display_order: number; caption: string | null };

export async function generateMetadata({ params }: { params: { projectId: string } }): Promise<Metadata> {
  const supabase = createAdminClient();
  const { data: project } = await supabase
    .from("projects")
    .select("title, description, project_media(public_url, display_order)")
    .or(`id.eq.${params.projectId},slug.eq.${params.projectId}`)
    .maybeSingle();
  if (!project) return { title: "Project | Leadstaq Cloud" };
  const media = (project.project_media as MediaItem[] | null) ?? [];
  const cover = media.sort((a, b) => a.display_order - b.display_order)[0]?.public_url;
  return {
    title: `${project.title as string} | Leadstaq Cloud`,
    description: (project.description as string | null) ?? undefined,
    openGraph: {
      title: project.title as string,
      description: (project.description as string | null) ?? undefined,
      images: cover ? [{ url: cover }] : [],
    },
  };
}

export default async function CloudSharePage({ params }: { params: { projectId: string } }) {
  const supabase = createAdminClient();
  const { data: project } = await supabase
    .from("projects")
    .select("*, clients(name, primary_color, slug), project_media(*)")
    .or(`id.eq.${params.projectId},slug.eq.${params.projectId}`)
    .eq("is_public", true)
    .maybeSingle();

  if (!project) notFound();

  const client = project.clients as { name: string; primary_color: string | null; slug: string } | null;
  const accentColor = client?.primary_color ?? "#D4FF4F";
  const media = ((project.project_media ?? []) as MediaItem[]).sort(
    (a, b) => a.display_order - b.display_order
  );
  const cover = media[0]?.public_url;

  const profileSlug = project.client_id
    ? await (async () => {
        const { data: cp } = await supabase
          .from("client_profiles")
          .select("slug")
          .eq("client_id", project.client_id as string)
          .maybeSingle();
        return (cp as { slug?: string } | null)?.slug ?? client?.slug ?? null;
      })()
    : null;

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="sticky top-0 z-10 border-b border-gray-100 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-10">
          <div className="flex items-center gap-4">
            {profileSlug && (
              <Link
                href={`/p/${profileSlug}`}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900"
              >
                <ArrowLeft className="h-4 w-4" />
                {client?.name ?? "Back"}
              </Link>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/cloud"
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700"
            >
              <CloudUpload className="h-3.5 w-3.5" />
              Powered by Leadstaq Cloud
            </Link>
            {profileSlug && (
              <a
                href={`/p/${profileSlug}#contact`}
                className="rounded-md px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-90"
                style={{ backgroundColor: accentColor, color: "#0a0a0a" }}
              >
                Get a Quote
              </a>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      {cover && (
        <div className="relative h-[55vh] max-h-[560px] overflow-hidden bg-gray-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={cover} alt={project.title as string} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-0 left-0 px-8 pb-8 lg:px-14">
            <h1 className="text-3xl font-light text-white lg:text-5xl">{project.title as string}</h1>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-10">
        {/* Project meta */}
        <div className="mb-10 border-b border-gray-100 pb-8">
          {!cover && (
            <h1 className="mb-4 text-3xl font-light text-gray-900">{project.title as string}</h1>
          )}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
            {project.category && (
              <span className="rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-700">
                {project.category as string}
              </span>
            )}
            {project.location && (
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />{project.location as string}
              </span>
            )}
            {project.completion_date && (
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                {new Date(project.completion_date as string).toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </span>
            )}
          </div>
          {project.description && (
            <p className="mt-5 max-w-2xl text-gray-600 leading-relaxed">
              {project.description as string}
            </p>
          )}
        </div>

        {/* Gallery */}
        {media.length > 1 && (
          <div className="mb-12">
            <p className="mb-5 font-mono text-[11px] uppercase tracking-[0.18em] text-gray-400">Gallery</p>
            <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
              {media.map((item, idx) => (
                <div key={item.id} className="mb-4 overflow-hidden rounded-xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.public_url}
                    alt={item.caption ?? `Photo ${idx + 1}`}
                    className="w-full object-cover"
                    loading={idx < 3 ? "eager" : "lazy"}
                  />
                  {item.caption && (
                    <p className="mt-1.5 px-1 text-xs text-gray-400">{item.caption}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        {profileSlug && (
          <div
            className="rounded-2xl p-10 text-center"
            style={{ backgroundColor: `${accentColor}22` }}
          >
            <h2 className="mb-3 text-2xl font-semibold text-gray-900">
              Interested in a project like this?
            </h2>
            <p className="mb-6 text-gray-600">Get a free quote from {client?.name ?? "us"} today.</p>
            <a
              href={`/p/${profileSlug}#contact`}
              className="inline-flex items-center gap-2 rounded-md px-8 py-4 text-sm font-semibold transition-opacity hover:opacity-90"
              style={{ backgroundColor: accentColor, color: "#0a0a0a" }}
            >
              Get a Free Quote
            </a>
          </div>
        )}
      </div>

      <footer className="border-t border-gray-100 py-8">
        <div className="mx-auto max-w-7xl px-6 text-center text-sm text-gray-400 lg:px-10">
          {client?.name} &middot;{" "}
          <a href="https://cloud.leadstaq.tech" className="hover:text-gray-600">
            Powered by Leadstaq Cloud
          </a>
        </div>
      </footer>
    </div>
  );
}
