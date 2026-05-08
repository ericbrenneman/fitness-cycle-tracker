import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();
  // Extract only the origin — strips any accidental /rest/v1/ path or trailing slashes
  let url = raw;
  try {
    url = new URL(raw).origin;
  } catch {
    url = raw.replace(/\/+$/, "").replace(/\/(rest|auth|storage|realtime).*$/, "");
  }
  // isSingleton: false bypasses the module-level cache so URL changes always take effect
  return createBrowserClient(url, key, { isSingleton: false });
}
