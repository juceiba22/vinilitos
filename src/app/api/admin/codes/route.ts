import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { randomCode } from "@/lib/codeFormat";

export async function GET(req: NextRequest) {
  const batchName = req.nextUrl.searchParams.get("batchName");
  if (!batchName) {
    return NextResponse.json({ error: "Falta el parámetro batchName." }, { status: 400 });
  }

  const codes = await prisma.activationCode.findMany({
    where: { batchName },
    orderBy: { createdAt: "asc" },
    select: { code: true, used: true },
  });

  return NextResponse.json({ codes });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const batchName = typeof body?.batchName === "string" ? body.batchName.trim() : "";
  const quantity = Number(body?.quantity);

  if (!batchName) {
    return NextResponse.json({ error: "Falta el nombre de la tirada." }, { status: 400 });
  }
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 500) {
    return NextResponse.json(
      { error: "La cantidad debe ser un número entero entre 1 y 500." },
      { status: 400 }
    );
  }

  const codes = Array.from({ length: quantity }, () => ({
    code: `VNLT-${randomCode()}`,
    batchName,
  }));

  await prisma.activationCode.createMany({ data: codes });

  return NextResponse.json({ ok: true, codes: codes.map((c) => c.code) });
}
