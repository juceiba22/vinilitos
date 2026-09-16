import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { prisma } from "@/lib/prisma";
import { oneYearFrom } from "@/lib/subscription";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const page = await prisma.page.findUnique({ where: { id } });
  if (!page) {
    return NextResponse.json({ error: "Página no encontrada." }, { status: 404 });
  }

  // Idempotente: si ya estaba publicada no reseteamos el año de suscripción
  // ni el código de edición ya entregado al artista.
  if (page.published && page.editToken) {
    return NextResponse.json({
      slug: page.slug,
      editToken: page.editToken,
      editUrl: `/editor/${page.slug}/${page.editToken}`,
      publicUrl: `/${page.slug}`,
    });
  }

  const updated = await prisma.page.update({
    where: { id },
    data: {
      published: true,
      editToken: page.editToken ?? nanoid(24),
      subscriptionExpiresAt: oneYearFrom(new Date()),
    },
  });

  return NextResponse.json({
    slug: updated.slug,
    editToken: updated.editToken,
    editUrl: `/editor/${updated.slug}/${updated.editToken}`,
    publicUrl: `/${updated.slug}`,
  });
}
