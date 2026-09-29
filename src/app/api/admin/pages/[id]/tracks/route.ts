import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const MAX_TRACKS = 60;
const MAX_LYRICS_LENGTH = 20000;

// Guarda de una sola vez el tipo de lanzamiento (álbum / single) y la lista
// completa de canciones con sus letras, reemplazando la anterior.
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json().catch(() => null);

  const releaseType = body?.releaseType;
  if (releaseType !== "album" && releaseType !== "single") {
    return NextResponse.json({ error: "Tipo de lanzamiento inválido." }, { status: 400 });
  }

  const rawTracks: unknown = body?.tracks;
  if (!Array.isArray(rawTracks)) {
    return NextResponse.json({ error: "Faltan las canciones." }, { status: 400 });
  }

  const tracks = rawTracks
    .map((t) => ({
      title: typeof t?.title === "string" ? t.title.trim() : "",
      lyrics: typeof t?.lyrics === "string" ? t.lyrics.replace(/\r\n/g, "\n").trim() : "",
    }))
    .filter((t) => t.title || t.lyrics);

  if (releaseType === "single" && tracks.length > 1) {
    return NextResponse.json(
      { error: "Un single tiene una sola canción." },
      { status: 400 }
    );
  }
  if (tracks.length > MAX_TRACKS) {
    return NextResponse.json({ error: "Demasiadas canciones." }, { status: 400 });
  }
  if (tracks.some((t) => !t.title)) {
    return NextResponse.json(
      { error: "Cada canción necesita un título." },
      { status: 400 }
    );
  }
  if (tracks.some((t) => t.lyrics.length > MAX_LYRICS_LENGTH)) {
    return NextResponse.json({ error: "Alguna letra es demasiado larga." }, { status: 400 });
  }

  const page = await prisma.page.findUnique({ where: { id }, select: { id: true } });
  if (!page) {
    return NextResponse.json({ error: "Página no encontrada." }, { status: 404 });
  }

  const [, , , saved] = await prisma.$transaction([
    prisma.page.update({ where: { id }, data: { releaseType } }),
    prisma.track.deleteMany({ where: { pageId: id } }),
    prisma.track.createMany({
      data: tracks.map((t, index) => ({
        pageId: id,
        title: t.title,
        lyrics: t.lyrics || null,
        order: index,
      })),
    }),
    prisma.track.findMany({ where: { pageId: id }, orderBy: { order: "asc" } }),
  ]);

  return NextResponse.json({ ok: true, tracks: saved });
}
