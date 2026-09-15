import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";
import { oneYearFrom } from "@/lib/subscription";

async function uniqueSlug(base: string): Promise<string> {
  const cleanBase = slugify(base) || "artista";
  let candidate = cleanBase;
  let attempt = 0;
  while (await prisma.page.findUnique({ where: { slug: candidate } })) {
    attempt += 1;
    candidate = `${cleanBase}-${attempt + 1}`;
  }
  return candidate;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const code = typeof body?.code === "string" ? body.code.trim().toUpperCase() : "";
  const artistName = typeof body?.artistName === "string" ? body.artistName.trim() : "";
  const contactEmail =
    typeof body?.contactEmail === "string" ? body.contactEmail.trim() : "";

  if (!code) {
    return NextResponse.json({ error: "Falta el código de activación." }, { status: 400 });
  }
  if (!artistName) {
    return NextResponse.json({ error: "Falta el nombre del artista." }, { status: 400 });
  }
  if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
    return NextResponse.json({ error: "El mail no es válido." }, { status: 400 });
  }

  const activation = await prisma.activationCode.findUnique({ where: { code } });

  if (!activation) {
    return NextResponse.json({ error: "Código inválido." }, { status: 404 });
  }
  if (activation.used) {
    const existingPage = await prisma.page.findUnique({
      where: { activationCodeId: activation.id },
    });
    return NextResponse.json(
      {
        error: "Este código ya fue canjeado.",
        existingSlug: existingPage?.slug ?? null,
      },
      { status: 409 }
    );
  }

  const slug = await uniqueSlug(artistName);
  const editToken = nanoid(24);

  const page = await prisma.$transaction(async (tx) => {
    const created = await tx.page.create({
      data: {
        slug,
        editToken,
        artistName,
        activationCodeId: activation.id,
        subscriptionExpiresAt: oneYearFrom(new Date()),
        contactEmail: contactEmail || null,
      },
    });
    await tx.activationCode.update({
      where: { id: activation.id },
      data: { used: true, usedAt: new Date() },
    });
    return created;
  });

  return NextResponse.json({
    slug: page.slug,
    editToken: page.editToken,
    editUrl: `/editor/${page.slug}/${page.editToken}`,
    publicUrl: `/${page.slug}`,
  });
}
