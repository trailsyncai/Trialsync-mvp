import { createClient } from "@/lib/supabase-server";
import { TopBar } from "@/components/topbar";
import { MatchForm } from "@/components/match-form";
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
        <div className="kicker" style={{ marginTop: 14 }}>NEW</div>
        <h1 className="h-title" style={{ marginBottom: 18 }}>Save a match run</h1>
        <MatchForm />
      </div>
    </div>
  );
}
