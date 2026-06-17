import { createClient } from "@/lib/supabase-server";
import { TopBar } from "@/components/topbar";
import { RunDetail } from "@/components/run-detail";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function RunPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: run, error } = await supabase
    .from("match_runs")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !run) notFound();

  return (
    <div>
      <TopBar email={user.email} />
      <div className="container" style={{ paddingTop: 26, paddingBottom: 60, maxWidth: 720 }}>
        <Link href="/dashboard" className="muted" style={{ fontSize: 13, textDecoration: "none" }}>
          {"\u2190"} Back to dashboard
        </Link>
        <div style={{ marginTop: 14 }}>
          <RunDetail run={run} />
        </div>
      </div>
    </div>
  );
}
