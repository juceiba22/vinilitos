import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { randomCode } from "@/lib/codeFormat";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; linkId: string }> }
) {
  const { id, linkId } = await params;

  const link = await prisma.link.findUnique({
    where: { id: linkId },
    include: { code: true },
  });
  if (!link || link.pageId !== id) {
    return NextResponse.json({ error: "Link no encontrado." }, { status: 404 });
  }

  // Idempotente: si ya tiene código generado, devolvemos el existente en vez
  // de crear uno nuevo (el vínculo link↔código es 1:1).
  if (link.code) {
    return NextResponse.json({ code: link.code });
  }

  let created;
  for (let attempt = 0; attempt < 5; attempt++) {
    created = await prisma.linkCode
      .create({ data: { linkId, code: `VNLT-${randomCode()}` } })
      .catch(() => null);
    if (created) break;
  }
  if (!created) {
    return NextResponse.json({ error: "No se pudo generar el código." }, { status: 500 });
  }

  return NextResponse.json({ code: created });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; linkId: string }> }
) {
  const { id, linkId } = await params;
  const body = await req.json().catch(() => null);
  const nfcWritten = Boolean(body?.nfcWritten);

  const link = await prisma.link.findUnique({
    where: { id: linkId },
    include: { code: true },
  });
  if (!link || link.pageId !== id || !link.code) {
    return NextResponse.json({ error: "Este link todavía no tiene código." }, { status: 404 });
  }

  const updated = await prisma.linkCode.update({
    where: { linkId },
    data: { nfcWritten, nfcWrittenAt: nfcWritten ? new Date() : null },
  });

  return NextResponse.json({ code: updated });
}
