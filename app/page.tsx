import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function Home() {
  const s = await getServerSession(authOptions);
  if (!s) redirect("/login");
  if (s.role === "AGENCY_ADMIN") redirect("/dashboard");
  if (s.role === "CLIENT_MANAGER") redirect("/client/dashboard");
  redirect("/sales/leads");
}
