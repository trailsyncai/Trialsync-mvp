import { createClient } from "@/lib/supabase-server";
import { TopBar } from "@/components/topbar";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type Run = {
  id: string;
  patient_label: string;
  trial_name: string;
  eligible: boolean;
  criteria_met: number;
  criteria_total: number;
  created_at: string;
};

export default async function Dashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: runs } = await supabase
    .from("match_runs")
    .select("id, patient_label, trial_name, eligible, criteria_met, criteria_total, created_at")
    .order("created_at", { ascending: false });

  const list = (runs ?? []) as Run[];

  return (
    <div>
      <TopBar email={user.email} />
      <div className="container" style={{ paddingTop: 30, paddingBottom: 60 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22, flexWrap: "wrap", gap: 12 }}>
          <div>
            <div className="kicker">YOUR SAVED MATCH RUNS</div>
            <h1 className="h-title">Dashboard</h1>
          </div>
          <Link href="/match/new" className="btn">+ New match run</Link>
        </div>

        {list.length === 0 ? (
          <div className="card" style={{ textAlign: "center", padding: "48px 24px" }}>
            <div style={{ fontFamily: "Cambria, serif", fontSize: 18, fontWeight: 700, marginBottom: 6 }}>No runs yet</div>
            <p className="muted" style={{ fontSize: 14, marginBottom: 18 }}>
              Save your first patient-trial match to see it here.
            </p>
            <Link href="/match/new" className="btn" style={{ display: "inline-flex" }}>Create your first run</Link>
          </div>
        ) : (
          <div>
            {list.map((r) => (
              <Link key={r.id} href={`/match/${r.id}`} className="run-row">
                <span className={`pill ${r.eligible ? "pill-hit" : "pill-miss"}`}>
                  {r.eligible ? "ELIGIBLE" : "Not eligible"}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14.5 }}>{r.patient_label}</div>
                  <div className="muted" style={{ fontSize: 12.5, marginTop: 2 }}>
                    {r.trial_name}
                  </div>
                </div>
                <div className="muted" style={{ fontSize: 12.5, textAlign: "right" }}>
                  <div>{r.criteria_met}/{r.criteria_total} rules met</div>
                  <div style={{ marginTop: 2 }}>{new Date(r.created_at).toLocaleDateString()}</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
