import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { LivePublicLanding } from "@/components/landing/LivePublicLanding";
import { PreviewChrome } from "@/components/landing/PreviewChrome";
import type { FormSchemaRow, LandingPageRow } from "@/types";

export const dynamic = "force-dynamic";

export default async function LandingPreviewPage({ params }: { params: { slug: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.role !== "AGENCY_ADMIN") {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/p/${params.slug}/preview`)}`);
  }

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

  return (
    <>
      <PreviewChrome />
      <LivePublicLanding
        initialLanding={(landing as LandingPageRow) ?? ({} as LandingPageRow)}
        clientId={client.id as string}
        slug={params.slug}
        formSchema={form as FormSchemaRow | null}
        termsUrl={(legal?.terms_url as string | null) ?? null}
        privacyUrl={(legal?.privacy_url as string | null) ?? null}
        lockedTemplate={lockedTemplate}
      />
    </>
  );
}
