import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; linkId: string }> }
) {
  const { id, linkId } = await params;

  const link = await prisma.link.findUnique({ where: { id: linkId } });
  if (!link || link.pageId !== id) {
    return NextResponse.json({ error: "Link no encontrado." }, { status: 404 });
  }

  await prisma.link.delete({ where: { id: linkId } });

  return NextResponse.json({ ok: true });
}
