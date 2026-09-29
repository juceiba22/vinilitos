import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deleteObject } from "@/lib/r2";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; photoId: string }> }
) {
  const { id, photoId } = await params;
  const body = await req.json().catch(() => null);
  if (typeof body?.caption !== "string") {
    return NextResponse.json({ error: "Falta el epígrafe." }, { status: 400 });
  }

  const photo = await prisma.photo.findFirst({ where: { id: photoId, pageId: id } });
  if (!photo) {
    return NextResponse.json({ error: "Foto no encontrada." }, { status: 404 });
  }

  const updated = await prisma.photo.update({
    where: { id: photoId },
    data: { caption: body.caption.trim() || null },
  });

  return NextResponse.json({ ok: true, photo: updated });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; photoId: string }> }
) {
  const { id, photoId } = await params;

  const photo = await prisma.photo.findFirst({ where: { id: photoId, pageId: id } });
  if (!photo) {
    return NextResponse.json({ error: "Foto no encontrada." }, { status: 404 });
  }

  try {
    await deleteObject(photo.key);
  } catch {
    return NextResponse.json(
      { error: "No se pudo borrar la foto de R2." },
      { status: 502 }
    );
  }
  await prisma.photo.delete({ where: { id: photoId } });

  return NextResponse.json({ ok: true });
}
