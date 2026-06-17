"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase-client";
import { useRouter } from "next/navigation";
import { posthog } from "@/components/analytics";

type Criterion = { n?: number; criterion: string; status: "hit" | "miss" | "unknown"; source: string; note: string };
type Summary = { eligible: boolean; met: number; total: number; headline: string; critical: string };

const DOT: Record<string, string> = { hit: "dot-hit", miss: "dot-miss", unknown: "dot-unknown" };
const GLYPH: Record<string, string> = { hit: "\u2713", miss: "\u2715", unknown: "?" };

function InputBlock({
  label, value, onText, onFile, busy,
}: {
  label: string;
  value: string;
  onText: (v: string) => void;
  onFile: (f: File) => void;
  busy: boolean;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span className="kicker">{label}</span>
        <button type="button" className="btn btn-secondary" style={{ padding: "6px 13px", fontSize: 12.5 }}
          onClick={() => fileRef.current?.click()} disabled={busy}>
          Upload PDF / .txt
        </button>
        <input ref={fileRef} type="file" accept=".pdf,.txt,.md,text/plain" style={{ display: "none" }}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ""; }} />
      </div>
      <textarea className="inp" value={value} onChange={(e) => onText(e.target.value)} disabled={busy}
        placeholder={`Paste the ${label.toLowerCase()} here \u2014 or use Upload above.`} style={{ minHeight: 150 }} />
    </div>
  );
}

export function AiMatchForm() {
  const router = useRouter();
  const [patientLabel, setPatientLabel] = useState("");
  const [trialName, setTrialName] = useState("");
  const [patientText, setPatientText] = useState("");
  const [trialText, setTrialText] = useState("");
  const [results, setResults] = useState<Criterion[] | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState("");
  const [matching, setMatching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [extracting, setExtracting] = useState(false);

  async function handleFile(which: "patient" | "trial", file: File) {
    setError("");
    setExtracting(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/extract", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Couldn't read that file."); setExtracting(false); return; }
      if (which === "patient") setPatientText(data.text);
      else setTrialText(data.text);
    } catch {
      setError("Couldn't read that file. Try pasting the text instead.");
    }
    setExtracting(false);
  }

  async function runMatch() {
    setError("");
    setResults(null);
    setSummary(null);
    if (patientText.trim().length < 10 || trialText.trim().length < 10) {
      setError("Add both the patient information and the trial rules first.");
      return;
    }
    setMatching(true);
    try {
      const res = await fetch("/api/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientText, trialText }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "The AI match failed."); setMatching(false); return; }
      setResults(data.results);
      setSummary(data.summary);
      try { posthog?.capture("ai_match_run", { eligible: data.summary?.eligible, total: data.summary?.total }); } catch {}
    } catch {
      setError("The AI match failed. Please try again.");
    }
    setMatching(false);
  }

  async function saveRun() {
    if (!results || !summary) return;
    if (!patientLabel.trim() || !trialName.trim()) {
      setError("Add a patient label and a trial name before saving.");
      return;
    }
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const { error } = await supabase.from("match_runs").insert({
      user_id: user.id,
      patient_label: patientLabel.trim(),
      trial_name: trialName.trim(),
      criteria: results.map((r) => ({ text: r.criterion, status: r.status, source: r.source })),
      criteria_met: summary.met,
      criteria_total: summary.total,
      eligible: summary.eligible,
    });
    if (error) { setError(error.message); setSaving(false); return; }
    try { posthog?.capture("match_run_created", { eligible: summary.eligible, criteria_total: summary.total }); } catch {}
    router.push("/dashboard");
    router.refresh();
  }

  const busy = matching || extracting || saving;

  return (
    <div>
      {error && <div className="error">{error}</div>}
      {extracting && <div className="notice">Reading your file\u2026</div>}

      <div className="card" style={{ marginBottom: 16 }}>
        <label className="field">
          <span>PATIENT LABEL (for your records)</span>
          <input className="inp" value={patientLabel} onChange={(e) => setPatientLabel(e.target.value)}
            placeholder="e.g. Patient 48817 (62F, oncology)" disabled={busy} />
        </label>
        <label className="field" style={{ marginBottom: 0 }}>
          <span>TRIAL NAME (for your records)</span>
          <input className="inp" value={trialName} onChange={(e) => setTrialName(e.target.value)}
            placeholder="e.g. NCT-ONC-2291 \u2014 Phase II HER2-negative breast" disabled={busy} />
        </label>
      </div>

      <InputBlock label="PATIENT INFORMATION" value={patientText} onText={setPatientText} onFile={(f) => handleFile("patient", f)} busy={busy} />
      <InputBlock label="TRIAL ELIGIBILITY RULES" value={trialText} onText={setTrialText} onFile={(f) => handleFile("trial", f)} busy={busy} />

      <button className="btn" onClick={runMatch} disabled={busy} style={{ width: "100%" }}>
        {matching ? "AI is reading the rules\u2026" : "Run AI match"}
      </button>

      {summary && results && (
        <div style={{ marginTop: 22 }}>
          <div className={`card`} style={{ background: summary.eligible ? "var(--teal)" : "var(--miss)", color: "#fff", marginBottom: 14 }}>
            <div className="serif" style={{ fontSize: 20, fontWeight: 700 }}>
              {summary.eligible ? "\u2713 " : "\u2715 "}{summary.headline}
            </div>
            <div style={{ fontSize: 13, opacity: 0.92, marginTop: 3 }}>
              {summary.met}/{summary.total} rules met
            </div>
          </div>

          {summary.critical && (
            <div className="notice" style={{ marginBottom: 14 }}>{summary.critical}</div>
          )}

          {results.map((r, i) => (
            <div key={i} className="crit">
              <span className={`dot ${DOT[r.status]}`}>{GLYPH[r.status]}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700 }}>{r.n ?? i + 1}. {r.criterion}</div>
                {r.source && <div style={{ fontSize: 12, color: "var(--teal)", marginTop: 3, fontFamily: "Consolas, monospace" }}>{"\u21b3"} {r.source}</div>}
                {r.note && <div style={{ fontSize: 12.5, color: "var(--gray)", marginTop: 3 }}>{r.note}</div>}
              </div>
            </div>
          ))}

          <div style={{ display: "flex", gap: 12, marginTop: 18 }}>
            <button className="btn btn-teal" onClick={saveRun} disabled={saving}>
              {saving ? "Saving\u2026" : "Save this run"}
            </button>
            <button className="btn btn-ghost" onClick={() => router.push("/dashboard")} disabled={saving}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
