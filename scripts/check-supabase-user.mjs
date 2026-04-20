/**
 * Verifies .env.local Supabase can read public.users (same as NextAuth).
 * Run: node scripts/check-supabase-user.mjs
 */
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

const envPath = resolve(process.cwd(), ".env.local");
if (!existsSync(envPath)) {
  console.error("Missing .env.local");
  process.exit(1);
}

for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
  const t = line.trim();
  if (!t || t.startsWith("#")) continue;
  const eq = t.indexOf("=");
  if (eq < 1) continue;
  const key = t.slice(0, eq).trim();
  let val = t.slice(eq + 1).trim();
  if (
    (val.startsWith('"') && val.endsWith('"')) ||
    (val.startsWith("'") && val.endsWith("'"))
  ) {
    val = val.slice(1, -1);
  }
  process.env[key] = val;
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Need NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

let host;
try {
  host = new URL(url).hostname;
} catch {
  host = "(bad URL)";
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

const email = "admin@leadstaq.com";

const { data: rows, error: listErr } = await supabase
  .from("users")
  .select("id, email")
  .limit(20);

const { data: one, error: oneErr } = await supabase
  .from("users")
  .select("id, email, role, is_active")
  .eq("email", email)
  .maybeSingle();

console.log("Supabase host:", host);
console.log("List users (first 20) error:", listErr?.message ?? null);
console.log("Rows sample:", rows?.length ?? 0, "emails:", rows?.map((r) => r.email).join(", ") || "(none)");

console.log("Lookup", JSON.stringify(email), "error:", oneErr?.message ?? null);
console.log("Lookup result:", one ?? "(no row)");

if (!one && !oneErr) {
  console.log(
    "\n=> No row for that email in THIS project. Run seed.sql in the SQL editor for project:",
    host
  );
  process.exit(1);
}

if (oneErr) {
  console.error("\n=> Supabase error — check service_role key and API settings.");
  process.exit(1);
}

console.log("\n=> OK: user row is visible to the API. If login still fails, restart next dev and clear cookies.");
process.exit(0);
