import { NextRequest, NextResponse } from "next/server";
import { fetchLinkPreview } from "@/lib/linkPreview";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const url = typeof body?.url === "string" ? body.url.trim() : "";

  if (!url || !/^https?:\/\//i.test(url)) {
    return NextResponse.json({ error: "URL inválida." }, { status: 400 });
  }

  const preview = await fetchLinkPreview(url);
  return NextResponse.json(preview);
}
