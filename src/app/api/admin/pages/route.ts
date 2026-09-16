import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { uniquePageSlug } from "@/lib/slug";
import { oneYearFrom } from "@/lib/subscription";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const artistName = typeof body?.artistName === "string" ? body.artistName.trim() : "";

  if (!artistName) {
    return NextResponse.json({ error: "Falta el nombre del artista." }, { status: 400 });
  }

  const slug = await uniquePageSlug(artistName);

  const page = await prisma.page.create({
    data: {
      slug,
      artistName,
      subscriptionExpiresAt: oneYearFrom(new Date()),
    },
  });

  return NextResponse.json({ id: page.id, slug: page.slug });
}
