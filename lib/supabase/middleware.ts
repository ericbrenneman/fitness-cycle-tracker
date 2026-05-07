import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

  // If credentials aren't configured at all, just let the request through.
  if (!rawUrl || !rawKey) {
    return supabaseResponse;
  }

  const url = rawUrl.replace(/\/+$/, "").trim();
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
    // If Supabase is unreachable or throws, pass the request through.
    // The individual pages handle their own auth checks.
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
