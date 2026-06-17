import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const maxDuration = 60;

type Criterion = { text: string; status: "hit" | "miss" | "unknown"; source: string };

export async function POST(request: Request) {
  // 1. Require a logged-in user (per-account security).
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  // 2. Key stays server-side only — never sent to the browser.
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "AI is not configured. Set GEMINI_API_KEY in the environment." },
      { status: 500 }
    );
  }

  let body: { patientText?: string; trialText?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }

  const patientText = (body.patientText || "").trim();
  const trialText = (body.trialText || "").trim();
  if (patientText.length < 10 || trialText.length < 10) {
    return NextResponse.json(
      { error: "Please provide both the patient information and the trial rules." },
      { status: 400 }
    );
  }

  const prompt = `You are the matching engine inside TrialSync AI, used by oncology research coordinators. You are given a clinical trial's eligibility rules (free text) and one patient's records (which may be scattered across systems). For EACH numbered rule, decide whether the patient SATISFIES it (for inclusion rules) or is NOT EXCLUDED by it (for exclusion rules). Reason from the patient's actual values. Where a rule is vague (e.g. "adequate renal function" with no threshold), interpret it the way a clinician would and say so. Watch exclusion rules with exception clauses: a surface keyword may look disqualifying while the full rule actually permits the patient.

Return ONLY valid JSON, no markdown fences, in exactly this shape:
{"results":[{"n":1,"criterion":"<short paraphrase of the rule>","status":"hit"|"miss"|"unknown","source":"<the patient value + where it came from>","note":"<one sentence of reasoning>"}],"summary":{"eligible":true|false,"met":<integer>,"total":<integer>,"headline":"<one short line>","critical":"<the single rule most likely misread by a keyword search, as a factual finding>"}}
status "hit" = satisfied / not exclusionary; "miss" = disqualifies; "unknown" = genuinely indeterminate from the records. Set summary.eligible to true only if no rule is "miss".

TRIAL ELIGIBILITY RULES:
${trialText}

PATIENT RECORDS:
${patientText}`;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: { responseMimeType: "application/json", temperature: 0.2 },
    });
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const parsed = JSON.parse(text);

    // Basic shape guard.
    if (!parsed.results || !Array.isArray(parsed.results) || !parsed.summary) {
      throw new Error("Unexpected AI response shape.");
    }
    // Normalize / clamp.
    const results: Criterion[] = parsed.results.map((r: any, i: number) => ({
      n: typeof r.n === "number" ? r.n : i + 1,
      criterion: String(r.criterion || "Rule"),
      status: ["hit", "miss", "unknown"].includes(r.status) ? r.status : "unknown",
      source: String(r.source || ""),
      note: String(r.note || ""),
    }));
    const met = results.filter((r) => r.status === "hit").length;
    const eligible = results.length > 0 && results.every((r) => r.status === "hit");

    return NextResponse.json({
      results,
      summary: {
        eligible: typeof parsed.summary.eligible === "boolean" ? parsed.summary.eligible : eligible,
        met,
        total: results.length,
        headline: String(parsed.summary.headline || (eligible ? "Eligible" : "Not eligible")),
        critical: String(parsed.summary.critical || ""),
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: "The AI match failed. Please try again, or paste shorter text." },
      { status: 502 }
    );
  }
}
