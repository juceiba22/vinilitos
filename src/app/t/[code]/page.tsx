import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import VinylDisc from "@/components/VinylDisc";
import { isExpired } from "@/lib/subscription";

const PLATFORM_LABEL: Record<string, string> = {
  spotify: "Escuchar en Spotify",
  youtube: "Ver en YouTube",
  soundcloud: "Escuchar en SoundCloud",
  appleMusic: "Escuchar en Apple Music",
  bandcamp: "Escuchar en Bandcamp",
  other: "Abrir enlace",
};

export const dynamic = "force-dynamic";

export default async function TrackCodePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  const linkCode = await prisma.linkCode.findUnique({
    where: { code: code.trim().toUpperCase() },
    include: { link: { include: { page: true } } },
  });

  if (!linkCode || !linkCode.link.page.published) {
    notFound();
  }

  const { link } = linkCode;
  const { page } = link;

  await prisma.linkCode.update({
    where: { id: linkCode.id },
    data: { scannedCount: { increment: 1 } },
  });

  const expired = isExpired(page.subscriptionExpiresAt);

  return (
    <main
      className="flex-1 flex flex-col items-center px-6 py-16"
      style={{ background: page.themeColor }}
    >
      <div className="w-full max-w-md flex flex-col items-center">
        <VinylDisc
          coverImageUrl={link.thumbnailUrl}
          label={link.title || page.artistName}
          size={220}
        />

        <p className="text-vinyl-accent text-xs uppercase tracking-[0.2em] mt-6 text-center">
          {page.artistName}
        </p>
        <h1 className="font-display text-2xl mt-2 text-center text-vinyl-cream">
          {link.title || "Tu vinilito"}
        </h1>

        {expired ? (
          <div className="w-full mt-8 bg-vinyl-black-soft/80 border border-vinyl-line rounded-xl p-6 text-center">
            <p className="text-vinyl-accent text-xs uppercase tracking-wide mb-2">
              Suscripción vencida
            </p>
            <p className="text-vinyl-cream-dim text-sm">
              Esta página venció y sus links están ocultos temporalmente.
              Contactá a Vinilitos para renovarla.
            </p>
          </div>
        ) : (
          <a
            href={link.url}
            target="_blank"
            rel="noreferrer"
            className="w-full mt-8 bg-vinyl-accent hover:bg-vinyl-accent-dim transition-colors text-vinyl-black font-semibold rounded-full px-6 py-3 text-center"
          >
            {PLATFORM_LABEL[link.platform] ?? "Abrir enlace"}
          </a>
        )}

        <Link
          href={`/${page.slug}`}
          className="text-vinyl-cream-dim text-xs uppercase tracking-[0.2em] mt-8 underline hover:text-vinyl-cream"
        >
          Ver página completa de {page.artistName} →
        </Link>

        <a
          href="https://www.instagram.com/vinilitos.play/"
          target="_blank"
          rel="noreferrer"
          className="text-vinyl-cream-dim text-[11px] uppercase tracking-[0.2em] mt-12"
        >
          Hecho con Vinilitos
        </a>
      </div>
    </main>
  );
}
