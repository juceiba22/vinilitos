import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const orderedLinkIds: unknown = body?.orderedLinkIds;

  if (!Array.isArray(orderedLinkIds) || orderedLinkIds.some((v) => typeof v !== "string")) {
    return NextResponse.json({ error: "Falta el orden de links." }, { status: 400 });
  }

  const links = await prisma.link.findMany({ where: { pageId: id } });
  const linkIds = new Set(links.map((l) => l.id));
  if (
    orderedLinkIds.length !== links.length ||
    !orderedLinkIds.every((linkId: string) => linkIds.has(linkId))
  ) {
    return NextResponse.json({ error: "El orden no coincide con los links de la página." }, { status: 400 });
  }

  await prisma.$transaction(
    orderedLinkIds.map((linkId: string, index: number) =>
      prisma.link.update({ where: { id: linkId }, data: { order: index } })
    )
  );

  return NextResponse.json({ ok: true });
}
