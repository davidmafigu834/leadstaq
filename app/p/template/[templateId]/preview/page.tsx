import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { templateRowToLandingRow } from "@/lib/template-to-landing";
import { LivePublicLanding } from "@/components/landing/LivePublicLanding";
import { PreviewChrome } from "@/components/landing/PreviewChrome";
import { northfieldContentSchema, northfieldThemeSchema } from "@/lib/templates/northfield/schema";
import { NORTHFIELD_DEFAULT_CONTENT, NORTHFIELD_DEFAULT_THEME } from "@/lib/templates/northfield/defaults";
import { LockedTemplatePreviewClient } from "@/components/landing/templates/LockedTemplatePreviewClient";
import type { LandingPageRow } from "@/types";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { templateId: string } }): Promise<Metadata> {
  const supabase = createAdminClient();
  const { data: row } = await supabase.from("landing_page_templates").select("name").eq("id", params.templateId).maybeSingle();
  const name = (row?.name as string) ?? "Template";
  return {
    title: `${name} — Leadstaq Template Preview`,
    robots: { index: false, follow: false },
  };
}

export default async function TemplatePreviewPage({ params }: { params: { templateId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.role !== "AGENCY_ADMIN") {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/p/template/${params.templateId}/preview`)}`);
  }

  const supabase = createAdminClient();
  const { data: row } = await supabase.from("landing_page_templates").select("*").eq("id", params.templateId).maybeSingle();
  if (!row || !row.is_published) notFound();

  const tr = row as Record<string, unknown>;
  if (tr.is_locked) {
    const c = northfieldContentSchema.safeParse(tr.default_content ?? NORTHFIELD_DEFAULT_CONTENT);
    const t = northfieldThemeSchema.safeParse(tr.default_theme ?? NORTHFIELD_DEFAULT_THEME);
    if (!(tr.component_name as string)) notFound();
    return (
      <>
        <PreviewChrome templatePreview />
        <LockedTemplatePreviewClient
          componentName={tr.component_name as string}
          content={c.success ? c.data : NORTHFIELD_DEFAULT_CONTENT}
          theme={t.success ? t.data : NORTHFIELD_DEFAULT_THEME}
        />
      </>
    );
  }

  const slug = (row.slug as string) || "template";
  const landing = templateRowToLandingRow(tr, { slug });

  return (
    <>
      <PreviewChrome templatePreview />
      <LivePublicLanding
        initialLanding={landing as LandingPageRow}
        clientId="00000000-0000-0000-0000-000000000001"
        slug={slug}
        formSchema={null}
        termsUrl={null}
        privacyUrl={null}
        templatePreview
      />
    </>
  );
}
