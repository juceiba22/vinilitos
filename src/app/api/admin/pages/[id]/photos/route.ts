import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MAX_PHOTO_BYTES, deleteObject, headObject, publicUrlForKey } from "@/lib/r2";

// Paso 2 de la subida: una vez que el navegador subió el archivo a R2 con
// la URL firmada, se registra la foto en la base.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const key = typeof body?.key === "string" ? body.key : "";
  const caption =
    typeof body?.caption === "string" && body.caption.trim() ? body.caption.trim() : null;

  if (!key.startsWith(`pages/${id}/backstage/`)) {
    return NextResponse.json({ error: "Archivo inválido." }, { status: 400 });
  }

  const page = await prisma.page.findUnique({ where: { id }, select: { id: true } });
  if (!page) {
    return NextResponse.json({ error: "Página no encontrada." }, { status: 404 });
  }

  // Verificamos que el archivo realmente esté en R2 y sea una imagen de
  // tamaño razonable (la URL firmada no limita el tamaño por sí sola).
  const object = await headObject(key);
  if (!object) {
    return NextResponse.json(
      { error: "La foto no llegó a subirse. Probá de nuevo." },
      { status: 400 }
    );
  }
  if (object.size > MAX_PHOTO_BYTES || !object.contentType.startsWith("image/")) {
    await deleteObject(key).catch(() => {});
    return NextResponse.json({ error: "El archivo no es una foto válida." }, { status: 400 });
  }

  const last = await prisma.photo.findFirst({
    where: { pageId: id },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  const photo = await prisma.photo.create({
    data: {
      pageId: id,
      key,
      url: publicUrlForKey(key),
      caption,
      order: (last?.order ?? -1) + 1,
    },
  });

  return NextResponse.json({ ok: true, photo });
}
