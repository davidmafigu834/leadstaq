import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import { PublicLanding } from "@/components/landing/PublicLanding";
import type { FormSchemaRow, LandingPageRow } from "@/types";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const supabase = createAdminClient();
  const { data: client } = await supabase.from("clients").select("id, name").eq("slug", params.slug).maybeSingle();
  if (!client) return { title: "Leadstaq" };
  const { data: landing } = await supabase
    .from("landing_pages")
    .select("seo_title, seo_description, og_image_url")
    .eq("client_id", client.id)
    .maybeSingle();

  const name = client.name as string;
  const title = (landing?.seo_title as string | null)?.trim() || name;
  const description = (landing?.seo_description as string | null)?.trim() || undefined;
  const og = (landing?.og_image_url as string | null)?.trim();

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: og ? [{ url: og }] : [],
    },
  };
}

export default async function PublicPage({ params }: { params: { slug: string } }) {
  const supabase = createAdminClient();
  const { data: client } = await supabase.from("clients").select("*").eq("slug", params.slug).maybeSingle();
  if (!client) notFound();
  if (client.is_active === false || (client as { is_archived?: boolean }).is_archived) {
    notFound();
  }
  const { data: landing } = await supabase.from("landing_pages").select("*").eq("client_id", client.id).maybeSingle();
  let lockedTemplate: { component_name: string; default_content?: unknown; default_theme?: unknown } | null = null;
  if (landing && (landing as { is_locked_template?: boolean }).is_locked_template && (landing as { applied_template_id?: string }).applied_template_id) {
    const { data: tpl } = await supabase
      .from("landing_page_templates")
      .select("component_name, default_content, default_theme")
      .eq("id", (landing as { applied_template_id: string }).applied_template_id)
      .maybeSingle();
    if (tpl) lockedTemplate = tpl as unknown as typeof lockedTemplate;
  }
  const { data: form } = await supabase.from("form_schemas").select("*").eq("client_id", client.id).maybeSingle();

  const { data: legal } = await supabase.from("agency_settings").select("terms_url, privacy_url").eq("id", "singleton").maybeSingle();

  if (landing && landing.published === false) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-content">
        <p className="text-text-secondary">This page is not published yet.</p>
      </div>
    );
  }

  return (
    <PublicLanding
      clientId={client.id as string}
      slug={params.slug}
      landing={(landing as LandingPageRow) ?? ({} as LandingPageRow)}
      formSchema={form as FormSchemaRow | null}
      termsUrl={(legal?.terms_url as string | null) ?? null}
      privacyUrl={(legal?.privacy_url as string | null) ?? null}
      lockedTemplate={lockedTemplate}
    />
  );
}
