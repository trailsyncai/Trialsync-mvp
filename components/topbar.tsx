"use client";

import { createClient } from "@/lib/supabase-client";
import { useRouter } from "next/navigation";
import { posthog } from "@/components/analytics";

export function TopBar({ email }: { email?: string }) {
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    try {
      posthog?.capture("user_signed_out");
      posthog?.reset();
    } catch {}
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="topbar">
      <div className="brand-badge">{"\u2764"}</div>
      <div style={{ flex: 1 }}>
        <div className="brand-name">TrialSync AI</div>
        <div className="brand-sub">PATIENT-TRIAL MATCHING</div>
      </div>
      {email && (
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ color: "#9fbebc", fontSize: 13 }}>{email}</span>
          <button onClick={signOut} className="btn btn-secondary" style={{ padding: "8px 16px", fontSize: 13, color: "#fff", borderColor: "#2c5a62" }}>
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
