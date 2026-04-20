import type { DefaultSession } from "next-auth";
import type { UserRole } from "@/types";

declare module "next-auth" {
  interface Session extends DefaultSession {
    userId: string;
    role: UserRole;
    clientId: string | null;
    user: DefaultSession["user"] & {
      id: string;
    };
  }
  interface User {
    id: string;
    role: UserRole;
    clientId: string | null;
    sessionVersion?: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId: string;
    role: UserRole;
    clientId: string | null;
    sessionVersion?: number;
  }
}
