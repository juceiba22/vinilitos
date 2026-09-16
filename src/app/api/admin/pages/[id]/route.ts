import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Body inválido." }, { status: 400 });
  }

  const page = await prisma.page.findUnique({ where: { id } });
  if (!page) {
    return NextResponse.json({ error: "Página no encontrada." }, { status: 404 });
  }

  const data: {
    artistName?: string;
    albumTitle?: string | null;
    bio?: string | null;
    coverImageUrl?: string | null;
    themeColor?: string;
    contactEmail?: string | null;
  } = {};

  if (typeof body.artistName === "string" && body.artistName.trim()) {
    data.artistName = body.artistName.trim();
  }
  if (typeof body.albumTitle === "string") {
    data.albumTitle = body.albumTitle.trim() || null;
  }
  if (typeof body.bio === "string") {
    data.bio = body.bio.trim() || null;
  }
  if (typeof body.coverImageUrl === "string") {
    data.coverImageUrl = body.coverImageUrl.trim() || null;
  }
  if (
    typeof body.themeColor === "string" &&
    /^#[0-9a-fA-F]{6}$/.test(body.themeColor)
  ) {
    data.themeColor = body.themeColor;
  }
  if (typeof body.contactEmail === "string") {
    const contactEmail = body.contactEmail.trim();
    if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
      return NextResponse.json({ error: "El mail no es válido." }, { status: 400 });
    }
    data.contactEmail = contactEmail || null;
  }

  const updated = await prisma.page.update({ where: { id }, data });

  return NextResponse.json({ ok: true, page: updated });
}
