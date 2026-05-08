import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

function getSupabaseOrigin(raw: string): string {
  try {
    return new URL(raw).origin;
  } catch {
    return raw.replace(/\/+$/, "").replace(/\/(rest|auth|storage|realtime).*$/, "");
  }
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

  if (!rawUrl || !rawKey) {
    return supabaseResponse;
  }

  const url = getSupabaseOrigin(rawUrl);
  const key = rawKey.trim();

  let user: { id: string } | null = null;

  try {
    const supabase = createServerClient(url, key, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    });

    const result = await supabase.auth.getUser();
    user = result.data?.user ?? null;
  } catch (err) {
    console.error("[proxy] Supabase auth check failed:", err);
    return supabaseResponse;
  }

  const isAuthPage = request.nextUrl.pathname.startsWith("/auth");

  if (!user && !isAuthPage) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/auth";
    return NextResponse.redirect(redirectUrl);
  }

  if (user && isAuthPage && !request.nextUrl.pathname.startsWith("/auth/callback")) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/dashboard";
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}
