import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { oneYearFrom } from "@/lib/subscription";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const code = typeof body?.code === "string" ? body.code.trim().toUpperCase() : "";
  const slug = typeof body?.slug === "string" ? body.slug.trim() : "";
  const editToken = typeof body?.editToken === "string" ? body.editToken : "";

  if (!code || !slug || !editToken) {
    return NextResponse.json({ error: "Faltan datos para renovar." }, { status: 400 });
  }

  const page = await prisma.page.findUnique({ where: { slug } });
  if (!page || page.editToken !== editToken) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const renewal = await prisma.renewalCode.findUnique({ where: { code } });
  if (!renewal) {
    return NextResponse.json({ error: "Código de renovación inválido." }, { status: 404 });
  }
  if (renewal.used) {
    return NextResponse.json(
      { error: "Este código de renovación ya fue canjeado." },
      { status: 409 }
    );
  }

  const base =
    page.subscriptionExpiresAt.getTime() > Date.now()
      ? page.subscriptionExpiresAt
      : new Date();
  const newExpiresAt = oneYearFrom(base);

  const updated = await prisma.$transaction(async (tx) => {
    await tx.renewalCode.update({
      where: { id: renewal.id },
      data: { used: true, usedAt: new Date(), pageId: page.id },
    });
    return tx.page.update({
      where: { id: page.id },
      data: { subscriptionExpiresAt: newExpiresAt },
    });
  });

  return NextResponse.json({
    ok: true,
    subscriptionExpiresAt: updated.subscriptionExpiresAt,
  });
}
