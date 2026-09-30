import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import VinylDisc from "@/components/VinylDisc";
import { isExpired } from "@/lib/subscription";
import { getCoverPalette, paletteToCssVars } from "@/lib/coverPalette";
import { parseCredits } from "@/lib/credits";

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
    include: {
      links: { orderBy: { order: "asc" } },
      tracks: { orderBy: { order: "asc" } },
      photos: { orderBy: { order: "asc" } },
    },
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

  const credits = parseCredits(page.credits);
  const hasInfo = credits.length > 0 || !!page.recordedAt || !!page.thanks;
  const cardClass =
    "bg-vinyl-black-soft/70 backdrop-blur-md border border-vinyl-line rounded-xl";

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
            className="absolute inset-0 w-full h-full object-cover scale-110 blur-[2px] saturate-125 opacity-90"
          />
          <div
            className="absolute inset-0"
            style={{
              background: palette
                ? "linear-gradient(180deg, color-mix(in oklab, var(--vinyl-black) 10%, transparent) 0%, color-mix(in oklab, var(--vinyl-black) 22.5%, transparent) 55%, color-mix(in oklab, var(--vinyl-black) 32.5%, transparent) 100%)"
                : `linear-gradient(180deg, ${page.themeColor}1a 0%, ${page.themeColor}39 55%, ${page.themeColor}53 100%)`,
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
          <>
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

          {page.tracks.length > 0 && (
            <section className="w-full mt-12">
              <SectionTitle>
                {page.releaseType === "single" ? "Letra" : "Canciones y letras"}
              </SectionTitle>
              <ul className="flex flex-col gap-2">
                {page.tracks.map((track, i) =>
                  track.lyrics ? (
                    <li key={track.id}>
                      <details className={`${cardClass} group`}>
                        <summary className="flex items-center gap-3 p-3 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                          {page.releaseType !== "single" && (
                            <span className="text-vinyl-accent text-xs w-5 text-right shrink-0">
                              {i + 1}
                            </span>
                          )}
                          <span className="flex-1 text-sm text-vinyl-cream">
                            {track.title}
                          </span>
                          <span className="text-[11px] uppercase tracking-wide text-vinyl-accent group-open:hidden">
                            Ver letra
                          </span>
                          <span className="text-[11px] uppercase tracking-wide text-vinyl-accent hidden group-open:inline">
                            Cerrar
                          </span>
                        </summary>
                        <p className="px-4 pb-5 pt-1 text-sm leading-relaxed text-vinyl-cream whitespace-pre-line">
                          {track.lyrics}
                        </p>
                      </details>
                    </li>
                  ) : (
                    <li key={track.id} className={`${cardClass} flex items-center gap-3 p-3`}>
                      {page.releaseType !== "single" && (
                        <span className="text-vinyl-accent text-xs w-5 text-right shrink-0">
                          {i + 1}
                        </span>
                      )}
                      <span className="flex-1 text-sm text-vinyl-cream">{track.title}</span>
                    </li>
                  )
                )}
              </ul>
            </section>
          )}

          {hasInfo && (
            <section className="w-full mt-12">
              <SectionTitle>Info</SectionTitle>
              <div className={`${cardClass} p-5 flex flex-col gap-5 text-sm`}>
                {credits.length > 0 && (
                  <dl className="flex flex-col gap-2">
                    {credits.map((credit, i) => (
                      <div key={i} className="flex gap-2">
                        {credit.role && (
                          <dt className="text-vinyl-accent shrink-0">{credit.role}:</dt>
                        )}
                        <dd className="text-vinyl-cream">{credit.names}</dd>
                      </div>
                    ))}
                  </dl>
                )}
                {page.recordedAt && (
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-vinyl-accent mb-1">
                      Grabado en
                    </p>
                    <p className="text-vinyl-cream">{page.recordedAt}</p>
                  </div>
                )}
                {page.thanks && (
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-vinyl-accent mb-1">
                      Agradecimientos
                    </p>
                    <p className="text-vinyl-cream whitespace-pre-line leading-relaxed">
                      {page.thanks}
                    </p>
                  </div>
                )}
              </div>
            </section>
          )}

          {page.photos.length > 0 && (
            <section className="w-full mt-12">
              <SectionTitle>Backstage</SectionTitle>
              <ul className="grid grid-cols-2 gap-3">
                {page.photos.map((photo) => (
                  <li key={photo.id} className={`${cardClass} overflow-hidden`}>
                    <a href={photo.url} target="_blank" rel="noreferrer">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photo.url}
                        alt={photo.caption ?? ""}
                        loading="lazy"
                        className="w-full aspect-square object-cover"
                      />
                    </a>
                    {photo.caption && (
                      <p className="px-3 py-2 text-xs text-vinyl-cream-dim">
                        {photo.caption}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}
          </>
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

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-display text-lg text-vinyl-cream text-center mb-4 [text-shadow:0_1px_8px_rgb(0_0_0/0.6)]">
      {children}
    </h2>
  );
}
