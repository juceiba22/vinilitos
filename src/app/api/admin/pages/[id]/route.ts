import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const MAX_CREDITS = 80;

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
    recordedAt?: string | null;
    thanks?: string | null;
    credits?: Prisma.InputJsonValue | typeof Prisma.DbNull;
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

  if (typeof body.recordedAt === "string") {
    data.recordedAt = body.recordedAt.trim() || null;
  }
  if (typeof body.thanks === "string") {
    data.thanks = body.thanks.trim() || null;
  }
  if (body.credits !== undefined) {
    if (!Array.isArray(body.credits) || body.credits.length > MAX_CREDITS) {
      return NextResponse.json({ error: "Créditos inválidos." }, { status: 400 });
    }
    const credits = body.credits
      .map((c: unknown) => {
        const credit = c as { role?: unknown; names?: unknown } | null;
        return {
          role: typeof credit?.role === "string" ? credit.role.trim() : "",
          names: typeof credit?.names === "string" ? credit.names.trim() : "",
        };
      })
      .filter((c: { role: string; names: string }) => c.role || c.names);
    data.credits = credits.length ? credits : Prisma.DbNull;
  }

  const updated = await prisma.page.update({ where: { id }, data });

  return NextResponse.json({ ok: true, page: updated });
}
