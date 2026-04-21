import { notFound } from "next/navigation";
import { AgencyLayout } from "@/components/layouts/AgencyLayout";
import { createAdminClient } from "@/lib/supabase/admin";
import { ClientDetailView } from "./ClientDetailView";
import { ClientOverviewTab } from "./ClientOverviewTab";
import { PulseBar } from "@/components/dashboard/PulseBar";
import { buildClientAvgResponsePulseMetric } from "@/components/dashboard/pulse-metrics";
import { getAvgResponseMinutes } from "@/lib/metrics";
import { fetchClientTeamOverview, fetchRecentLeadsForClient } from "@/lib/dashboard-data";
import { getPublicLandingPageUrl } from "@/lib/public-url";
import { addMonths, startOfMonth, subHours, subMonths } from "date-fns";
import { buildClientDetailHero } from "@/lib/client-hero";

export default async function ClientDetailPage({ params }: { params: { clientId: string } }) {
  const supabase = createAdminClient();
  const { data: client } = await supabase.from("clients").select("*").eq("id", params.clientId).maybeSingle();
  if (!client) notFound();

  const now = new Date();
  const monthStart = startOfMonth(now);
  const nextMonthStart = startOfMonth(addMonths(now, 1));
  const prevMonthStart = startOfMonth(subMonths(now, 1));
  const cid = params.clientId;

  const weekAgo = subHours(new Date(), 24 * 7).toISOString();

  const [{ data: wl }, { data: won }, avgCurrent, avgPrev, { data: landing }, { data: formSchema }, recentLeads, team] =
    await Promise.all([
      supabase.from("leads").select("id, status").eq("client_id", cid).gte("created_at", weekAgo),
      supabase
        .from("leads")
        .select("id")
        .eq("client_id", cid)
        .eq("status", "WON")
        .gte("updated_at", monthStart.toISOString()),
      getAvgResponseMinutes(monthStart, nextMonthStart, { clientId: cid }),
      getAvgResponseMinutes(prevMonthStart, monthStart, { clientId: cid }),
      supabase.from("landing_pages").select("published").eq("client_id", cid).maybeSingle(),
      supabase.from("form_schemas").select("fields").eq("client_id", cid).maybeSingle(),
      fetchRecentLeadsForClient(cid),
      fetchClientTeamOverview(cid),
    ]);

  const landingPublicUrl = getPublicLandingPageUrl(client.slug as string);
  const landingPublished = Boolean(landing?.published);
  const fbPageName = (client.fb_page_name as string | null) ?? null;
  const notificationsConfigured =
    Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) &&
    Boolean(process.env.RESEND_API_KEY);

  const hero = buildClientDetailHero(
    {
      fb_form_id: client.fb_form_id as string | null,
      fb_page_name: client.fb_page_name as string | null,
      fb_token_expired_at: client.fb_token_expired_at as string | null,
      twilio_whatsapp_override: client.twilio_whatsapp_override as string | null,
    },
    landingPublished
  );

  const formFields = (formSchema?.fields as unknown[] | null) ?? [];
  const formFieldCount = Array.isArray(formFields) ? formFields.length : 0;
  const salespeopleCount = team.filter((u) => u.role === "SALESPERSON").length;
  const hasManager = team.some((u) => u.role === "CLIENT_MANAGER");
  const fbConnected = Boolean(client.fb_form_id as string | null);

  const total = wl?.length ?? 0;
  const contactedN = wl?.filter((x) => x.status !== "NEW").length ?? 0;
  const rate = total ? Math.round((contactedN / total) * 100) : 0;

  const pulseMetrics = [
    { eyebrow: "Leads this week", value: String(total), delta: "Rolling 7d", deltaPositive: true, anchor: true },
    { eyebrow: "Contact rate", value: `${rate}%`, delta: "Within pipeline", deltaPositive: true },
    { eyebrow: "Deals won (MTD)", value: String(won?.length ?? 0), delta: "Updated this month", deltaPositive: true },
    buildClientAvgResponsePulseMetric(avgCurrent, avgPrev),
  ];

  return (
    <AgencyLayout
      breadcrumb={`AGENCY / CLIENTS / ${(client.name as string).toUpperCase()}`}
      pageTitle={client.name as string}
    >
      <ClientDetailView
        clientId={cid}
        name={client.name as string}
        industry={client.industry as string}
        publicLandingUrl={landingPublicUrl}
        hero={hero}
      >
        <PulseBar metrics={pulseMetrics} />
        <ClientOverviewTab
          clientId={cid}
          clientName={client.name as string}
          recentLeads={recentLeads}
          team={team}
          landingPublished={landingPublished}
          landingPublicUrl={landingPublicUrl}
          fbPageName={fbPageName}
          notificationsConfigured={notificationsConfigured}
          onboarding={{ formFieldCount, salespeopleCount, hasManager, fbConnected }}
        />
      </ClientDetailView>
    </AgencyLayout>
  );
}
