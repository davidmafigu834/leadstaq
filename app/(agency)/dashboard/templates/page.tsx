import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { AgencyLayout } from "@/components/layouts/AgencyLayout";
import { landingRowHasContent } from "@/lib/landing-empty";
import { TemplateMarketplace, type ClientForTemplate } from "./TemplateMarketplace";

export const dynamic = "force-dynamic";

export default async function TemplatesPage({
  searchParams,
}: {
  searchParams: { applyTo?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session || session.role !== "AGENCY_ADMIN") {
    redirect("/login?callbackUrl=/dashboard/templates");
  }

  const supabase = createAdminClient();
  const { data: clients } = await supabase
    .from("clients")
    .select("id, name, industry, slug")
    .eq("is_active", true)
    .eq("is_archived", false)
    .order("name");

  const ids = (clients ?? []).map((c) => c.id as string);
  let landings: { client_id: string; hero_headline: unknown; about_text: unknown; services: unknown; projects: unknown }[] = [];
  if (ids.length) {
    const { data } = await supabase
      .from("landing_pages")
      .select("client_id, hero_headline, about_text, services, projects")
      .in("client_id", ids);
    landings = data ?? [];
  }
  const byClient = new Map(landings.map((l) => [l.client_id as string, l]));

  const rows: ClientForTemplate[] =
    clients?.map((c) => {
      const id = c.id as string;
      const row = byClient.get(id);
      return {
        id,
        name: c.name as string,
        industry: (c.industry as string) ?? "",
        slug: c.slug as string,
        landingHasContent: landingRowHasContent((row ?? null) as Record<string, unknown> | null),
      };
    }) ?? [];

  return (
    <AgencyLayout breadcrumb="AGENCY / TEMPLATES" pageTitle="Templates" titleSize="hero">
      <TemplateMarketplace applyToClientId={searchParams.applyTo} clients={rows} />
    </AgencyLayout>
  );
}
