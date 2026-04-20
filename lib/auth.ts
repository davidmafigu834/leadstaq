import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyPassword } from "@/lib/password";
import type { UserRole } from "@/types";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const email = credentials.email.toLowerCase().trim();
        const supabase = createAdminClient();
        const { data: user, error } = await supabase
          .from("users")
          .select("id, name, email, password, role, client_id, is_active, session_version")
          .eq("email", email)
          .maybeSingle();
        const dev = process.env.NODE_ENV === "development";
        const supabaseHost = (() => {
          try {
            return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").hostname || "(missing NEXT_PUBLIC_SUPABASE_URL)";
          } catch {
            return "(invalid NEXT_PUBLIC_SUPABASE_URL)";
          }
        })();
        if (error) {
          if (dev) console.error("[next-auth] Supabase users lookup failed:", error.message, error);
          return null;
        }
        if (!user) {
          if (dev) {
            console.error(
              "[next-auth] No row in public.users for",
              JSON.stringify(email),
              "— app is using Supabase host:",
              supabaseHost,
              "(open this project in the dashboard and confirm the user exists there, or fix .env.local)"
            );
          }
          return null;
        }
        if (!user.is_active) {
          if (dev) console.warn("[next-auth] User inactive:", email);
          return null;
        }
        const hash = String(user.password ?? "").trim();
        const ok = await verifyPassword(credentials.password, hash);
        if (!ok && dev) console.error("[next-auth] Password did not match stored hash for:", email);
        if (!ok) return null;
        return {
          id: user.id as string,
          name: user.name as string,
          email: user.email as string,
          role: user.role as UserRole,
          clientId: (user.client_id as string | null) ?? null,
          sessionVersion: Number((user as { session_version?: number }).session_version ?? 0),
        };
      },
    }),
  ],
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: "/login" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.role = user.role;
        token.clientId = user.clientId ?? null;
        token.sessionVersion = (user as { sessionVersion?: number }).sessionVersion ?? 0;
      }
      return token;
    },
    async session({ session, token }) {
      session.userId = token.userId as string;
      session.role = token.role as UserRole;
      session.clientId = (token.clientId as string | null) ?? null;
      if (session.user) {
        session.user.id = token.userId as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
