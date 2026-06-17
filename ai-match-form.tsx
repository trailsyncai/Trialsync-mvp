import { createClient } from "@/lib/supabase-server";
import { TopBar } from "@/components/topbar";
import { AiMatchForm } from "@/components/ai-match-form";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function NewRun() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div>
      <TopBar email={user.email} />
      <div className="container" style={{ paddingTop: 26, paddingBottom: 60, maxWidth: 720 }}>
        <Link href="/dashboard" className="muted" style={{ fontSize: 13, textDecoration: "none" }}>
          {"\u2190"} Back to dashboard
        </Link>
        <div className="kicker" style={{ marginTop: 14 }}>NEW \u00b7 AI MATCH</div>
        <h1 className="h-title" style={{ marginBottom: 6 }}>Match a patient to a trial</h1>
        <p className="muted" style={{ fontSize: 14, marginBottom: 18 }}>
          Paste or upload the patient&apos;s information and the trial&apos;s rules. The AI reads both and returns a rule-by-rule eligibility verdict you can save.
        </p>
        <AiMatchForm />
      </div>
    </div>
  );
}
