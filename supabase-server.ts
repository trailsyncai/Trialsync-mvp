"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-client";
import { useRouter } from "next/navigation";
import { posthog } from "@/components/analytics";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setNotice("");
    setBusy(true);
    const supabase = createClient();

    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setError(error.message);
        setBusy(false);
        return;
      }
      try {
        posthog?.capture("user_signed_up", { method: "email" });
      } catch {}
      // If email confirmation is OFF, a session exists immediately.
      if (data.session) {
        router.push("/dashboard");
        router.refresh();
      } else {
        setNotice("Account created. If email confirmation is on, check your inbox, then sign in.");
        setMode("signin");
        setBusy(false);
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
        setBusy(false);
        return;
      }
      try {
        posthog?.identify(email);
        posthog?.capture("user_signed_in", { method: "email" });
      } catch {}
      router.push("/dashboard");
      router.refresh();
    }
  }

  return (
    <div>
      <div className="topbar">
        <div className="brand-badge">{"\u2764"}</div>
        <div>
          <div className="brand-name">TrialSync AI</div>
          <div className="brand-sub">PATIENT-TRIAL MATCHING</div>
        </div>
      </div>

      <div className="narrow" style={{ paddingTop: 60 }}>
        <div className="kicker" style={{ marginBottom: 6 }}>
          {mode === "signin" ? "WELCOME BACK" : "CREATE YOUR ACCOUNT"}
        </div>
        <h1 className="h-title" style={{ marginBottom: 8 }}>
          {mode === "signin" ? "Sign in" : "Sign up"}
        </h1>
        <p className="muted" style={{ fontSize: 14, marginBottom: 22 }}>
          Save and manage trial-match runs. Your data is private to your account.
        </p>

        {error && <div className="error">{error}</div>}
        {notice && <div className="notice">{notice}</div>}

        <form onSubmit={submit} className="card">
          <label className="field">
            <span>EMAIL</span>
            <input
              className="inp"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </label>
          <label className="field">
            <span>PASSWORD</span>
            <input
              className="inp"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="at least 6 characters"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
            />
          </label>
          <button className="btn" type="submit" disabled={busy} style={{ width: "100%", marginTop: 4 }}>
            {busy ? "Working\u2026" : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: 18, fontSize: 14 }} className="muted">
          {mode === "signin" ? "No account yet? " : "Already have one? "}
          <button
            onClick={() => {
              setMode(mode === "signin" ? "signup" : "signin");
              setError("");
              setNotice("");
            }}
            style={{ background: "none", border: "none", color: "var(--teal)", fontWeight: 700, cursor: "pointer", fontSize: 14 }}
          >
            {mode === "signin" ? "Sign up" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}
