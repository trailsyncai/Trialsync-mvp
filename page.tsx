import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Bad upload." }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large (5MB max)." }, { status: 400 });
  }

  const name = file.name.toLowerCase();
  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    if (name.endsWith(".pdf")) {
      // pdf-parse is CommonJS; import the implementation directly to avoid its debug harness.
      const pdfParse = (await import("pdf-parse/lib/pdf-parse.js")).default;
      const data = await pdfParse(buffer);
      const text = (data.text || "").trim();
      if (!text) {
        return NextResponse.json(
          { error: "Couldn't read text from that PDF (it may be a scan). Try pasting the text instead." },
          { status: 422 }
        );
      }
      return NextResponse.json({ text });
    }

    if (name.endsWith(".txt") || name.endsWith(".md") || file.type.startsWith("text/")) {
      return NextResponse.json({ text: buffer.toString("utf-8").trim() });
    }

    return NextResponse.json(
      { error: "Unsupported file type. Upload a PDF or .txt, or paste the text." },
      { status: 415 }
    );
  } catch {
    return NextResponse.json(
      { error: "Couldn't read that file. Try pasting the text instead." },
      { status: 422 }
    );
  }
}
