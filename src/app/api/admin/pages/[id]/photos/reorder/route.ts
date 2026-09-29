import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const orderedPhotoIds: unknown = body?.orderedPhotoIds;

  if (!Array.isArray(orderedPhotoIds) || orderedPhotoIds.some((v) => typeof v !== "string")) {
    return NextResponse.json({ error: "Falta el orden de fotos." }, { status: 400 });
  }

  const photos = await prisma.photo.findMany({ where: { pageId: id } });
  const photoIds = new Set(photos.map((p) => p.id));
  if (
    orderedPhotoIds.length !== photos.length ||
    !orderedPhotoIds.every((photoId: string) => photoIds.has(photoId))
  ) {
    return NextResponse.json({ error: "El orden no coincide con las fotos de la página." }, { status: 400 });
  }

  await prisma.$transaction(
    orderedPhotoIds.map((photoId: string, index: number) =>
      prisma.photo.update({ where: { id: photoId }, data: { order: index } })
    )
  );

  return NextResponse.json({ ok: true });
}
