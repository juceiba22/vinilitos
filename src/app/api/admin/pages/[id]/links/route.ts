import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchLinkPreview } from "@/lib/linkPreview";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const url = typeof body?.url === "string" ? body.url.trim() : "";

  if (!url || !/^https?:\/\//i.test(url)) {
    return NextResponse.json({ error: "URL inválida." }, { status: 400 });
  }

  const page = await prisma.page.findUnique({ where: { id } });
  if (!page) {
    return NextResponse.json({ error: "Página no encontrada." }, { status: 404 });
  }

  const preview = await fetchLinkPreview(url);

  const lastLink = await prisma.link.findFirst({
    where: { pageId: id },
    orderBy: { order: "desc" },
  });

  const link = await prisma.link.create({
    data: {
      pageId: id,
      url,
      platform: preview.platform,
      title: preview.title,
      thumbnailUrl: preview.thumbnailUrl,
      order: lastLink ? lastLink.order + 1 : 0,
    },
  });

  // Si la página todavía no tiene portada, usamos la del primer link cargado.
  if (!page.coverImageUrl && preview.thumbnailUrl) {
    await prisma.page.update({
      where: { id },
      data: { coverImageUrl: preview.thumbnailUrl },
    });
  }

  return NextResponse.json({ link });
}
