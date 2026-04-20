import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import type { Session } from "next-auth";

export type AgencyAdminOk = { session: Session };
export type AgencyAdminErr = { error: string; status: number };

export async function requireAgencyAdmin(): Promise<AgencyAdminOk | AgencyAdminErr> {
  const session = await getServerSession(authOptions);
  if (!session?.userId || session.role !== "AGENCY_ADMIN") {
    return { error: "Unauthorized", status: 401 };
  }
  return { session };
}
