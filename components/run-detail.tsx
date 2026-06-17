"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-client";
import { useRouter } from "next/navigation";
import { MatchForm, type RunData, type Criterion } from "@/components/match-form";
import { posthog } from "@/components/analytics";

const DOT: Record<Criterion["status"], string> = { hit: "dot-hit", miss: "dot-miss", unknown: "dot-unknown" };
const GLYPH: Record<Criterion["status"], string> = { hit: "\u2713", miss: "\u2715", unknown: "?" };

export function RunDetail({ run }: { run: RunData & { eligible: boolean; criteria_met: number; criteria_total: number; created_at: string } }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  async function del() {
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase.from("match_runs").delete().eq("id", run.id!);
    if (error) {
      alert(error.message);
      setBusy(false);
      return;
    }
    try { posthog?.capture("match_run_deleted", { run_id: run.id }); } catch {}
    router.push("/dashboard");
    router.refresh();
  }

  if (editing) {
    return (
      <div>
        <div className="kicker" style={{ marginBottom: 4 }}>EDITING</div>
        <h1 className="h-title" style={{ marginBottom: 18 }}>{run.patient_label}</h1>
        <MatchForm initial={run} />
        <button className="btn btn-ghost" style={{ marginTop: 14 }} onClick={() => setEditing(false)}>
          Cancel edit
        </button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
        <div>
          <span className={`pill ${run.eligible ? "pill-hit" : "pill-miss"}`}>
            {run.eligible ? "ELIGIBLE" : "NOT ELIGIBLE"}
          </span>
          <h1 className="h-title" style={{ margin: "10px 0 4px" }}>{run.patient_label}</h1>
          <div className="muted" style={{ fontSize: 14 }}>{run.trial_name}</div>
          <div className="muted" style={{ fontSize: 12.5, marginTop: 4 }}>
            {run.criteria_met}/{run.criteria_total} rules met \u00b7 saved {new Date(run.created_at).toLocaleString()}
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-secondary" onClick={() => setEditing(true)}>Edit</button>
          <button className="btn btn-ghost" onClick={() => setConfirming(true)}>Delete</button>
        </div>
      </div>

      {confirming && (
        <div className="card" style={{ marginTop: 18, borderColor: "#f5c6c0", background: "#fdf4f3" }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Delete this match run?</div>
          <p className="muted" style={{ fontSize: 13.5, marginBottom: 14 }}>This permanently removes it from your account. This can\u2019t be undone.</p>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn" style={{ background: "var(--miss)" }} onClick={del} disabled={busy}>
              {busy ? "Deleting\u2026" : "Yes, delete"}
            </button>
            <button className="btn btn-ghost" onClick={() => setConfirming(false)} disabled={busy}>Keep it</button>
          </div>
        </div>
      )}

      <div style={{ marginTop: 22 }}>
        <div className="kicker" style={{ marginBottom: 10 }}>RULES & VERDICTS</div>
        {run.criteria.map((c, i) => (
          <div key={i} className="crit">
            <span className={`dot ${DOT[c.status]}`}>{GLYPH[c.status]}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13.5, fontWeight: 700 }}>{i + 1}. {c.text}</div>
              {c.source && (
                <div style={{ fontSize: 12, color: "var(--teal)", marginTop: 3, fontFamily: "Consolas, monospace" }}>
                  {"\u21b3"} {c.source}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
