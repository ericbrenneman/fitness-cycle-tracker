"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

function getConfigIssues() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  const issues: string[] = [];
  if (!url) issues.push("NEXT_PUBLIC_SUPABASE_URL is not set");
  else if (!url.startsWith("https://")) issues.push(`URL must start with https:// — got: "${url.slice(0, 30)}"`);
  if (!key) issues.push("NEXT_PUBLIC_SUPABASE_ANON_KEY is not set");
    else if (!key.startsWith("sb_publishable_") && !key.startsWith("eyJ")) {
      issues.push("Anon key should start with sb_publishable_ or eyJ");
    }
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

  // Stable single client — never recreated, avoids multiple-GoTrueClient warnings
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  useEffect(() => {
    const issues = getConfigIssues();
    setConfigIssues(issues);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (mode === "login") {
        console.log("[login] attempting signInWithPassword for", email.trim());
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        console.log("[login] result — error:", error, "session:", !!data?.session, "user:", data?.user?.email);
        if (error) throw error;
        if (data.session) {
          console.log("[login] session ok, redirecting to dashboard");
          router.push("/dashboard");
          router.refresh();
        } else {
          setError(
            "Login succeeded but no session was created. Your account may still need email confirmation — check your inbox, or go to Supabase → Authentication → Users and manually confirm your email there."
          );
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
          "Account created! Check your inbox for a confirmation email, then come back and log in. (If you don't see it, check your spam folder.)"
        );
        setMode("login");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
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
              onClick={() => { setMode(m); setError(null); setSuccess(null); }}
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
            </div>
          )}
          {success && (
            <div className="bg-green-400/10 border border-green-400/20 rounded-xl px-4 py-3">
              <p className="text-green-300 text-xs leading-relaxed">{success}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || configIssues.length > 0}
            className="w-full bg-accent text-white font-semibold py-3 rounded-xl text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent/90 transition-colors mt-1"
          >
            {loading ? "Please wait…" : mode === "login" ? "Log In" : "Create Account"}
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
