import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();
  let url = raw;
  try {
    url = new URL(raw).origin;
  } catch {
    url = raw.replace(/\/+$/, "").replace(/\/(rest|auth|storage|realtime).*$/, "");
  }
  return createBrowserClient(url, key);
}
