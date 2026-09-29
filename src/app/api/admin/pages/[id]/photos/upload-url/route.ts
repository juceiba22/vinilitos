import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { prisma } from "@/lib/prisma";
import {
  MAX_PHOTO_BYTES,
  createUploadUrl,
  extensionForType,
  isR2Configured,
} from "@/lib/r2";

// Paso 1 de la subida: el admin pide una URL firmada para subir la foto
// directo a R2. El paso 2 (registrarla) es POST /photos.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json().catch(() => null);

  if (!isR2Configured()) {
    return NextResponse.json(
      { error: "Falta configurar Cloudflare R2 en las variables de entorno." },
      { status: 500 }
    );
  }

  const contentType = typeof body?.contentType === "string" ? body.contentType : "";
  const size = typeof body?.size === "number" ? body.size : 0;
  const ext = extensionForType(contentType);
  if (!ext) {
    return NextResponse.json(
      { error: "Formato no soportado. Usá JPG, PNG, WEBP, GIF o AVIF." },
      { status: 400 }
    );
  }
  if (size <= 0 || size > MAX_PHOTO_BYTES) {
    return NextResponse.json(
      { error: "La foto tiene que pesar menos de 10 MB." },
      { status: 400 }
    );
  }

  const page = await prisma.page.findUnique({ where: { id }, select: { id: true } });
  if (!page) {
    return NextResponse.json({ error: "Página no encontrada." }, { status: 404 });
  }

  const key = `pages/${id}/backstage/${nanoid(16)}.${ext}`;
  const uploadUrl = await createUploadUrl(key, contentType);

  return NextResponse.json({ key, uploadUrl });
}
