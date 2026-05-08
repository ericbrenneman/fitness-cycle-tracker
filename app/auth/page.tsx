"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

function getSupabaseUrlStatus() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  const issues: string[] = [];
  if (!url) {
    issues.push("NEXT_PUBLIC_SUPABASE_URL is not set");
  } else if (!url.startsWith("https://")) {
    issues.push(`URL must start with https:// — got: "${url.slice(0, 30)}…"`);
  }
  if (!key) issues.push("NEXT_PUBLIC_SUPABASE_ANON_KEY is not set");
  else if (key.length < 100) issues.push("Anon key looks too short — make sure you copied the full value");
  return issues;
}

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [configIssues, setConfigIssues] = useState<string[]>([]);
  const router = useRouter();

  useEffect(() => {
    const issues = getSupabaseUrlStatus();
    setConfigIssues(issues);
    if (issues.length) console.error("[Supabase config issues]", issues);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const issues = getSupabaseUrlStatus();
    if (issues.length) {
      setError("Supabase is not configured correctly. See the warning above.");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    try {
      if (mode === "login") {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        if (data.session) {
          router.push("/dashboard");
          router.refresh();
        }
      } else {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (error) throw error;
        setSuccess(
          "Account created! You can log in now. (If email confirmation is required, check your inbox first.)"
        );
        setMode("login");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[Auth error]", err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <div className="text-4xl mb-3">🏋️</div>
          <h1 className="text-2xl font-bold tracking-tight">Cycle Tracker</h1>
          <p className="text-muted text-sm mt-1">Track your training cycles</p>
        </div>

        {/* Config warning — only visible when env vars are wrong */}
        {configIssues.length > 0 && (
          <div className="mb-6 bg-yellow-400/10 border border-yellow-400/30 rounded-xl px-4 py-3">
            <p className="text-yellow-300 text-xs font-semibold mb-1">Supabase configuration issue</p>
            {configIssues.map((issue, i) => (
              <p key={i} className="text-yellow-400/80 text-xs">{issue}</p>
            ))}
          </div>
        )}

        <div className="flex bg-surface rounded-xl p-1 mb-8 border border-border">
          {(["login", "register"] as const).map((m) => (
            <button
              key={m}
              onClick={() => {
                setMode(m);
                setError(null);
                setSuccess(null);
              }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                mode === m ? "bg-accent text-white" : "text-muted hover:text-white"
              }`}
            >
              {m === "login" ? "Log In" : "Register"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm text-muted mb-1.5">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              suppressHydrationWarning
              className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-white text-sm placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm text-muted mb-1.5">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              suppressHydrationWarning
              className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-white text-sm placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
            />
          </div>

          {error && (
            <div className="bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3">
              <p className="text-red-400 text-xs font-semibold mb-0.5">Error</p>
              <p className="text-red-300 text-xs leading-relaxed">{error}</p>
              {error.toLowerCase().includes("invalid") && (
                <p className="text-red-400/60 text-xs mt-2">
                  Tip: check that your Supabase URL and anon key are correct in Replit Secrets.
                </p>
              )}
            </div>
          )}
          {success && (
            <p className="text-green-400 text-sm bg-green-400/10 border border-green-400/20 rounded-xl px-4 py-3">
              {success}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || configIssues.length > 0}
            className="w-full bg-accent text-white font-semibold py-3 rounded-xl text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent/90 transition-colors mt-1"
          >
            {loading
              ? "Please wait…"
              : mode === "login"
              ? "Log In"
              : "Create Account"}
          </button>
        </form>

        {mode === "register" && (
          <p className="text-muted text-xs text-center mt-4">
            Password must be at least 6 characters.
          </p>
        )}
      </div>
    </div>
  );
}
