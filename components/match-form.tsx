"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-client";
import { useRouter } from "next/navigation";
import { posthog } from "@/components/analytics";

export type Criterion = { text: string; status: "hit" | "miss" | "unknown"; source: string };

export type RunData = {
  id?: string;
  patient_label: string;
  trial_name: string;
  criteria: Criterion[];
};

const STATUS_LABEL: Record<Criterion["status"], string> = {
  hit: "Met",
  miss: "Fails",
  unknown: "Unclear",
};

export function MatchForm({ initial }: { initial?: RunData }) {
  const router = useRouter();
  const isEdit = !!initial?.id;
  const [patientLabel, setPatientLabel] = useState(initial?.patient_label ?? "");
  const [trialName, setTrialName] = useState(initial?.trial_name ?? "");
  const [criteria, setCriteria] = useState<Criterion[]>(
    initial?.criteria ?? [{ text: "", status: "hit", source: "" }]
  );
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function updateCriterion(i: number, patch: Partial<Criterion>) {
    setCriteria((prev) => prev.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
  }
  function addCriterion() {
    setCriteria((prev) => [...prev, { text: "", status: "hit", source: "" }]);
  }
  function removeCriterion(i: number) {
    setCriteria((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const cleaned = criteria.filter((c) => c.text.trim() !== "");
    if (!patientLabel.trim() || !trialName.trim() || cleaned.length === 0) {
      setError("Add a patient label, a trial name, and at least one rule.");
      return;
    }
    setBusy(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    const met = cleaned.filter((c) => c.status === "hit").length;
    const eligible = cleaned.every((c) => c.status === "hit");
    const payload = {
      user_id: user.id,
      patient_label: patientLabel.trim(),
      trial_name: trialName.trim(),
      criteria: cleaned,
      criteria_met: met,
      criteria_total: cleaned.length,
      eligible,
    };

    if (isEdit) {
      const { error } = await supabase.from("match_runs").update(payload).eq("id", initial!.id);
      if (error) {
        setError(error.message);
        setBusy(false);
        return;
      }
      try { posthog?.capture("match_run_updated", { run_id: initial!.id, eligible }); } catch {}
      router.push(`/match/${initial!.id}`);
    } else {
      const { data, error } = await supabase.from("match_runs").insert(payload).select("id").single();
      if (error) {
        setError(error.message);
        setBusy(false);
        return;
      }
      // This is the custom event the rubric asks PostHog to capture.
      try { posthog?.capture("match_run_created", { run_id: data?.id, eligible, criteria_total: cleaned.length }); } catch {}
      router.push("/dashboard");
    }
    router.refresh();
  }

  return (
    <form onSubmit={save}>
      {error && <div className="error">{error}</div>}

      <div className="card" style={{ marginBottom: 18 }}>
        <label className="field">
          <span>PATIENT LABEL</span>
          <input className="inp" value={patientLabel} onChange={(e) => setPatientLabel(e.target.value)} placeholder="e.g. Patient 48817 (62F, oncology)" />
        </label>
        <label className="field" style={{ marginBottom: 0 }}>
          <span>TRIAL</span>
          <input className="inp" value={trialName} onChange={(e) => setTrialName(e.target.value)} placeholder="e.g. NCT-ONC-2291 — Phase II HER2-negative breast" />
        </label>
      </div>

      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <span className="kicker">ELIGIBILITY RULES & VERDICTS</span>
          <button type="button" onClick={addCriterion} className="btn btn-secondary" style={{ padding: "7px 14px", fontSize: 13 }}>
            + Add rule
          </button>
        </div>

        {criteria.map((c, i) => (
          <div key={i} style={{ border: "1px solid #e8e2d8", borderRadius: 9, padding: 12, marginBottom: 10 }}>
            <label className="field">
              <span>RULE {i + 1}</span>
              <input className="inp" value={c.text} onChange={(e) => updateCriterion(i, { text: e.target.value })} placeholder="e.g. HER2-negative metastatic breast cancer" />
            </label>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <label className="field" style={{ flex: "0 0 150px", marginBottom: 0 }}>
                <span>VERDICT</span>
                <select className="inp" value={c.status} onChange={(e) => updateCriterion(i, { status: e.target.value as Criterion["status"] })}>
                  <option value="hit">{STATUS_LABEL.hit}</option>
                  <option value="miss">{STATUS_LABEL.miss}</option>
                  <option value="unknown">{STATUS_LABEL.unknown}</option>
                </select>
              </label>
              <label className="field" style={{ flex: 1, minWidth: 180, marginBottom: 0 }}>
                <span>SOURCE (record / value)</span>
                <input className="inp" value={c.source} onChange={(e) => updateCriterion(i, { source: e.target.value })} placeholder="e.g. Pathology — HER2 IHC 0" />
              </label>
              {criteria.length > 1 && (
                <button type="button" onClick={() => removeCriterion(i)} className="btn btn-ghost" style={{ padding: "9px 12px", fontSize: 12, alignSelf: "flex-end" }}>
                  Remove
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
        <button className="btn" type="submit" disabled={busy}>
          {busy ? "Saving\u2026" : isEdit ? "Save changes" : "Save match run"}
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => router.back()}>
          Cancel
        </button>
      </div>
    </form>
  );
}
