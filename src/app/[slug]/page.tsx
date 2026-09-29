import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import VinylDisc from "@/components/VinylDisc";
import { isExpired } from "@/lib/subscription";
import { getCoverPalette, paletteToCssVars } from "@/lib/coverPalette";

const PLATFORM_LABEL: Record<string, string> = {
  spotify: "Escuchar en Spotify",
  youtube: "Ver en YouTube",
  soundcloud: "Escuchar en SoundCloud",
  appleMusic: "Escuchar en Apple Music",
  bandcamp: "Escuchar en Bandcamp",
  other: "Abrir enlace",
};

export default async function PublicArtistPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const page = await prisma.page.findUnique({
    where: { slug },
    include: { links: { orderBy: { order: "asc" } } },
  });

  if (!page || !page.published) {
    notFound();
  }

  const expired = isExpired(page.subscriptionExpiresAt);

  // La estética de la página sale del arte de tapa: fondo con la tapa
  // desenfocada y paleta de colores derivada de la imagen. Sin tapa (o si
  // no se pudo analizar) se usa el color de fondo elegido en el admin.
  const palette = await getCoverPalette(page.coverImageUrl);
  const themeVars = palette ? paletteToCssVars(palette) : {};

  return (
    <main
      className="relative isolate flex-1 flex flex-col items-center px-6 py-16 overflow-hidden"
      style={{
        ...themeVars,
        background: palette ? "var(--vinyl-black)" : page.themeColor,
      } as React.CSSProperties}
    >
      {page.coverImageUrl && (
        <div aria-hidden className="fixed inset-0 -z-10 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={page.coverImageUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover scale-125 blur-3xl saturate-150 opacity-70"
          />
          <div
            className="absolute inset-0"
            style={{
              background: palette
                ? "linear-gradient(180deg, color-mix(in oklab, var(--vinyl-black) 45%, transparent) 0%, color-mix(in oklab, var(--vinyl-black) 75%, transparent) 55%, var(--vinyl-black) 100%)"
                : `linear-gradient(180deg, ${page.themeColor}73 0%, ${page.themeColor}bf 55%, ${page.themeColor} 100%)`,
            }}
          />
        </div>
      )}

      <div className="w-full max-w-md flex flex-col items-center">
        <VinylDisc
          coverImageUrl={page.coverImageUrl}
          label={page.albumTitle || page.artistName}
          size={220}
        />

        <h1 className="font-display text-2xl mt-6 text-center text-vinyl-cream">
          {page.artistName}
        </h1>
        {page.albumTitle && (
          <p className="text-vinyl-accent text-sm mt-1 text-center">
            {page.albumTitle}
          </p>
        )}
        {page.bio && (
          <p className="text-vinyl-cream-dim text-sm mt-4 text-center max-w-sm">
            {page.bio}
          </p>
        )}

        {expired ? (
          <div className="w-full mt-8 bg-vinyl-black-soft/70 backdrop-blur-md border border-vinyl-line rounded-xl p-6 text-center">
            <p className="text-vinyl-accent text-xs uppercase tracking-wide mb-2">
              Suscripción vencida
            </p>
            <p className="text-vinyl-cream-dim text-sm">
              Esta página venció y sus links están ocultos temporalmente.
              Contactá a Vinilitos para renovarla.
            </p>
          </div>
        ) : (
          <div className="w-full flex flex-col gap-3 mt-8">
            {page.links.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 bg-vinyl-black-soft/70 hover:bg-vinyl-black-soft backdrop-blur-md border border-vinyl-line hover:border-vinyl-accent transition-colors rounded-xl p-3"
              >
                {link.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={link.thumbnailUrl}
                    alt=""
                    className="w-12 h-12 rounded-lg object-cover shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-vinyl-line shrink-0" />
                )}
                <div className="min-w-0 text-left">
                  <p className="text-[11px] uppercase tracking-wide text-vinyl-accent">
                    {PLATFORM_LABEL[link.platform] ?? "Abrir enlace"}
                  </p>
                  <p className="truncate text-sm text-vinyl-cream">
                    {link.title || link.url}
                  </p>
                </div>
              </a>
            ))}
            {page.links.length === 0 && (
              <p className="text-vinyl-cream-dim text-sm text-center">
                Esta página todavía no tiene links cargados.
              </p>
            )}
          </div>
        )}

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
