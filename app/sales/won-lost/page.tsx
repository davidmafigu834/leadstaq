import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { SalesLayout } from "@/components/layouts/SalesLayout";
import { WonLostClient } from "./WonLostClient";
import type { LeadWithClientResponseLimit } from "@/lib/leadStatus";

export default async function SalesWonLostPage() {
  const session = await getServerSession(authOptions);
  if (!session?.userId) redirect("/login");
  const supabase = createAdminClient();
  const { data: leads } = await supabase
    .from("leads")
    .select("*, clients ( response_time_limit_hours )")
    .eq("assigned_to_id", session.userId)
    .order("updated_at", { ascending: false });

  return (
    <SalesLayout breadcrumb="SALES / ARCHIVE" pageTitle="Won & Lost">
      <WonLostClient initialLeads={(leads ?? []) as LeadWithClientResponseLimit[]} />
    </SalesLayout>
  );
}
