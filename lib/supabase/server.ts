import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();
  let url = raw;
  try {
    url = new URL(raw).origin;
  } catch {
    url = raw.replace(/\/+$/, "").replace(/\/(rest|auth|storage|realtime).*$/, "");
  }
  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {}
      },
    },
  });
}
