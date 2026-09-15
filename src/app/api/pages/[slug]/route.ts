import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface LinkInput {
  url: string;
  platform: string;
  title?: string | null;
  thumbnailUrl?: string | null;
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const body = await req.json().catch(() => null);

  if (!body || typeof body.editToken !== "string") {
    return NextResponse.json({ error: "Falta el token de edición." }, { status: 400 });
  }

  const page = await prisma.page.findUnique({ where: { slug } });
  if (!page) {
    return NextResponse.json({ error: "Página no encontrada." }, { status: 404 });
  }
  if (page.editToken !== body.editToken) {
    return NextResponse.json({ error: "Token de edición inválido." }, { status: 403 });
  }

  const artistName =
    typeof body.artistName === "string" && body.artistName.trim()
      ? body.artistName.trim()
      : page.artistName;
  const albumTitle = typeof body.albumTitle === "string" ? body.albumTitle.trim() : null;
  const bio = typeof body.bio === "string" ? body.bio.trim() : null;
  const coverImageUrl =
    typeof body.coverImageUrl === "string" && body.coverImageUrl.trim()
      ? body.coverImageUrl.trim()
      : null;
  const themeColor =
    typeof body.themeColor === "string" && /^#[0-9a-fA-F]{6}$/.test(body.themeColor)
      ? body.themeColor
      : page.themeColor;

  const contactEmailInput =
    typeof body.contactEmail === "string" ? body.contactEmail.trim() : "";
  if (contactEmailInput && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmailInput)) {
    return NextResponse.json({ error: "El mail no es válido." }, { status: 400 });
  }
  const contactEmail = contactEmailInput || null;

  const links: LinkInput[] = Array.isArray(body.links)
    ? body.links
        .filter((l: unknown): l is LinkInput => !!l && typeof (l as LinkInput).url === "string")
        .slice(0, 50)
    : [];

  const updated = await prisma.$transaction(async (tx) => {
    await tx.link.deleteMany({ where: { pageId: page.id } });
    const result = await tx.page.update({
      where: { id: page.id },
      data: {
        artistName,
        albumTitle,
        bio,
        coverImageUrl,
        themeColor,
        contactEmail,
        links: {
          create: links.map((l, i) => ({
            url: l.url.trim(),
            platform: l.platform || "other",
            title: l.title ?? null,
            thumbnailUrl: l.thumbnailUrl ?? null,
            order: i,
          })),
        },
      },
      include: { links: { orderBy: { order: "asc" } } },
    });
    return result;
  });

  return NextResponse.json({ ok: true, page: updated });
}
