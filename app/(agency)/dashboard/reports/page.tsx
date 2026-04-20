import { AgencyLayout } from "@/components/layouts/AgencyLayout";
import { createAdminClient } from "@/lib/supabase/admin";
import { ReportsPageClient } from "./ReportsPageClient";

export default async function ReportsPage() {
  const supabase = createAdminClient();
  const { data: clients } = await supabase
    .from("clients")
    .select("id, name")
    .eq("is_active", true)
    .order("name");

  return (
    <AgencyLayout breadcrumb="" pageTitle="" hideShellHeader>
      <ReportsPageClient clients={clients ?? []} />
    </AgencyLayout>
  );
}
