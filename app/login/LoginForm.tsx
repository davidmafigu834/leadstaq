"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });
    setLoading(false);
    if (res?.error) {
      setError("Invalid email or password.");
      return;
    }
    const dest = searchParams.get("callbackUrl");
    if (dest) {
      router.push(dest);
      router.refresh();
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <div className="w-full max-w-md border border-border bg-surface-card p-10 shadow-sm">
      <div className="text-center">
        <div className="flex items-center justify-center gap-2">
          <span className="h-1.5 w-1.5 bg-[var(--accent)]" aria-hidden />
          <span className="font-display text-2xl tracking-display text-ink-primary">Leadstaq</span>
        </div>
        <p className="mt-3 text-sm text-ink-secondary">Sign in to your workspace</p>
      </div>
      <form className="mt-8 space-y-5" onSubmit={onSubmit}>
        <div>
          <label className="font-mono text-[11px] uppercase tracking-wide text-ink-secondary" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            className="input-base mt-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label className="font-mono text-[11px] uppercase tracking-wide text-ink-secondary" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            className="input-base mt-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error ? <div className="text-sm text-[var(--danger)]">{error}</div> : null}
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <p className="mt-8 text-center text-xs text-ink-tertiary">Accounts are created by your agency admin.</p>
    </div>
  );
}

export function LoginForm() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-md border border-border bg-surface-card p-8 text-center text-ink-tertiary">
          Loading…
        </div>
      }
    >
      <LoginFormInner />
    </Suspense>
  );
}
