import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { daysUntil, isExpired } from "@/lib/subscription";
import { sendEmail } from "@/lib/email";

// Días antes del vencimiento en los que se manda un recordatorio. Se corre
// una vez por día (ver vercel.json), así que un match exacto alcanza.
const REMINDER_THRESHOLD_DAYS = [30, 15, 7, 1];

function isSameDay(a: Date, b: Date): boolean {
  return a.toDateString() === b.toDateString();
}

function renewalReminderEmail(params: {
  artistName: string;
  daysLeft: number;
  expiresAtLabel: string;
  editUrl: string;
}): { subject: string; html: string } {
  const { artistName, daysLeft, expiresAtLabel, editUrl } = params;
  const dayWord = daysLeft === 1 ? "día" : "días";
  return {
    subject: `Tu página de Vinilitos vence en ${daysLeft} ${dayWord}`,
    html: `
      <p>Hola ${artistName},</p>
      <p>Tu página de Vinilitos vence el <strong>${expiresAtLabel}</strong> (en ${daysLeft} ${dayWord}). Pasada esa fecha, tus links dejan de mostrarse en tu página pública.</p>
      <p>Para renovarla, contactá a Vinilitos y pedí tu código de renovación, o si ya lo tenés, canjealo entrando a tu editor:</p>
      <p><a href="${editUrl}">${editUrl}</a></p>
    `,
  };
}

export async function GET(req: NextRequest) {
  const provided =
    req.nextUrl.searchParams.get("secret") ??
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  if (!process.env.CRON_SECRET || provided !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const pages = await prisma.page.findMany({
    where: { contactEmail: { not: null }, published: true },
  });

  const now = new Date();
  const appUrl = process.env.APP_URL ?? "http://localhost:3000";
  let sent = 0;

  for (const page of pages) {
    if (isExpired(page.subscriptionExpiresAt)) continue;
    if (page.lastReminderSentAt && isSameDay(page.lastReminderSentAt, now)) {
      continue;
    }

    const daysLeft = daysUntil(page.subscriptionExpiresAt);
    if (!REMINDER_THRESHOLD_DAYS.includes(daysLeft)) continue;

    const { subject, html } = renewalReminderEmail({
      artistName: page.artistName,
      daysLeft,
      expiresAtLabel: page.subscriptionExpiresAt.toLocaleDateString("es-AR"),
      editUrl: `${appUrl}/editor/${page.slug}/${page.editToken}`,
    });

    await sendEmail({ to: page.contactEmail!, subject, html });

    await prisma.page.update({
      where: { id: page.id },
      data: { lastReminderSentAt: now },
    });

    sent += 1;
  }

  return NextResponse.json({ ok: true, checked: pages.length, sent });
}
