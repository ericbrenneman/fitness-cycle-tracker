import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();
  // Always use just the origin — strips any accidental /rest/v1/ or trailing slashes
  let url = raw;
  try {
    url = new URL(raw).origin;
  } catch {
    url = raw.replace(/\/+$/, "").replace(/\/(rest|auth|storage|realtime).*$/, "");
  }
  return createBrowserClient(url, key);
}
