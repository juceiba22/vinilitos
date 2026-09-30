import type { Metadata } from "next";
import Image from "next/image";
import { Archivo, DM_Sans } from "next/font/google";

// La landing sigue la identidad del catálogo impreso (CATALOGO VINILITOS.pdf):
// amarillo mostaza + amarillo claro + negro, títulos en una grotesca extra
// ancha y textos en DM Sans. Estas fuentes y colores son solo de esta página;
// el resto del sitio mantiene su propio tema.
const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-catalog-display",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-catalog-sans",
});

export const metadata: Metadata = {
  title: "Vinilitos — Merchandising físico e interactivo para tu banda",
  description:
    "Discos vinilo miniatura (5x5cm) con el arte de tu álbum, código QR y NFC que conectan con tu música. Packs para lanzamientos, shows y giras.",
};

const WHATSAPP_URL =
  "https://wa.me/5491158638981?text=" +
  encodeURIComponent("¡Hola! Quiero encargar vinilitos para mi banda.");
const INSTAGRAM_URL = "https://www.instagram.com/vinilitos.play/";

const INCLUDES = [
  {
    title: "Arte 100% personalizado",
    body: "Tapa y contratapa en impresión de alta definición con el diseño de tu álbum, EP o single.",
    icon: IconArt,
  },
  {
    title: "Código QR",
    body: "En ambos lados del mini disco para lectura rápida.",
    icon: IconQr,
  },
  {
    title: "Tecnología NFC",
    body: "Incluida en cada sobre para conectar la música al instante apoyando el celular.",
    icon: IconNfc,
  },
  {
    title: "Conexión directa",
    body: "Dirige a tu perfil de Spotify, YouTube, Bandcamp o Linktree.",
    icon: IconLink,
  },
];

const PACKS = [
  {
    name: "Lanzamiento",
    units: "24 unidades",
    qr: "$2800",
    nfc: "$3800",
    idealFor: "Prensa, regalos a fans claves y fechas íntimas",
  },
  {
    name: "Show",
    units: "48 unidades",
    qr: "$2500",
    nfc: "$3500",
    idealFor: "Mesa de merch en recitales de mediano formato",
  },
  {
    name: "Gira",
    units: "+100 unidades",
    qr: "$2100",
    nfc: "$3100",
    idealFor: "Cobertura de gira o merchandising oficial",
  },
];

const STEPS = [
  {
    title: "Elegí tu pack",
    body: "Seleccioná la cantidad de unidades para tu proyecto.",
  },
  {
    title: "Enviá tu material",
    body: "Mandanos el diseño de tapa/contratapa y el enlace a tu música.",
  },
  {
    title: "Muestra digital",
    body: "Te enviamos una vista previa para aprobación antes de imprimir.",
  },
  {
    title: "Producción y entrega",
    body: "Recibís el merch listo para vender en tu próxima fecha.",
  },
];

const WORKS = [
  { src: "/landing/trabajo-caminante.webp", alt: "Vinilitos de Caminante, de Federico Gamba" },
  { src: "/landing/trabajo-epifanias.webp", alt: "Vinilito de Epifanías" },
  { src: "/landing/trabajo-oktubre.webp", alt: "Vinilito de Oktubre" },
  { src: "/landing/trabajo-color-blue.webp", alt: "Vinilitos de Color Blue" },
  { src: "/landing/trabajo-retrato.webp", alt: "Vinilito con tapa de retrato y su caja" },
];

export default function Home() {
  return (
    <main
      className={`${archivo.variable} ${dmSans.variable} catalog flex-1 bg-(--cat-black) text-(--cat-yellow)`}
    >
      {/* Portada */}
      <header className="relative overflow-hidden">
        <nav className="max-w-6xl mx-auto px-6 pt-6 flex flex-wrap justify-end gap-x-4 gap-y-2 sm:gap-x-6 text-xs uppercase tracking-[0.12em] sm:tracking-[0.2em] text-(--cat-yellow)/80">
          <a href="#que-es" className="hover:text-(--cat-yellow)">
            Qué es
          </a>
          <a href="#packs" className="hover:text-(--cat-yellow)">
            Packs
          </a>
          <a href="#pedido" className="hover:text-(--cat-yellow)">
            Pedidos
          </a>
          <a href="#trabajos" className="hover:text-(--cat-yellow)">
            Trabajos
          </a>
        </nav>
        {/* En celular el logo y "Catálogo" van apilados, como en el PDF; en
            pantallas anchas comparten fila para no dejar tanto negro arriba. */}
        <div className="max-w-6xl mx-auto px-6 pt-6 pb-10 md:pb-14 grid md:grid-cols-[1.25fr_1fr] md:items-end gap-8 md:gap-10">
          <Image
            src="/landing/logo-etiqueta.webp"
            alt="Vinilitos — Easy Play"
            width={900}
            height={457}
            priority
            className="w-full max-w-3xl mx-auto h-auto"
          />
          <h1 className="catalog-display text-right text-[11vw] sm:text-7xl md:text-[4.6vw] xl:text-6xl leading-none md:pb-6">
            Catálogo
          </h1>
        </div>
      </header>

      <section className="grid md:grid-cols-[1.4fr_1fr]">
        <div className="relative aspect-square md:aspect-auto md:h-[560px] lg:h-[620px]">
          <Image
            src="/landing/hero.webp"
            alt="Vinilitos de Facu Bronstein Vol. 1 y Vol. 2 con sus discos y QR"
            fill
            priority
            sizes="(min-width: 768px) 58vw, 100vw"
            className="object-cover object-[50%_60%]"
          />
        </div>
        <div className="bg-(--cat-yellow) text-(--cat-black) flex flex-col justify-end gap-8 p-8 md:p-12 lg:p-16">
          <p className="text-3xl md:text-4xl lg:text-5xl leading-tight max-w-md">
            Merchandising físico e interactivo para tu Banda
          </p>
          <div className="flex flex-col gap-3 max-w-sm">
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noreferrer"
              className="bg-(--cat-black) text-(--cat-yellow) hover:bg-(--cat-dark) transition-colors font-semibold rounded-full px-6 py-3 text-center"
            >
              Pedí los tuyos por WhatsApp
            </a>
            <a
              href="#packs"
              className="border-2 border-(--cat-black) hover:bg-(--cat-black)/10 transition-colors font-semibold rounded-full px-6 py-3 text-center"
            >
              Ver packs y tarifas
            </a>
          </div>
        </div>
      </section>

      {/* ¿Qué es un Vinilito? */}
      <section id="que-es" className="scroll-mt-4">
        <SectionBand title="¿Qué es un Vinilito?" />
        <div className="relative">
          <TextureBackground />
          <div className="relative max-w-6xl mx-auto px-6 py-14 md:py-20 grid md:grid-cols-[1fr_1.2fr] gap-12 items-start">
            <div>
              <p className="text-2xl md:text-3xl font-semibold leading-snug">
                Es un disco vinilo miniatura (5x5cm). Un objeto de colección
                interactivo que conecta el mundo físico con tu música digital.
              </p>
              <div className="mt-10 hidden md:block relative w-56 aspect-[648/1152] rotate-[-4deg] shadow-2xl rounded-sm overflow-hidden">
                <Image
                  src="/landing/caja-vinilitos.webp"
                  alt="Caja de vinilitos embalada con la etiqueta Vinilitos"
                  fill
                  sizes="224px"
                  className="object-cover"
                />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-6">¿Qué incluye cada unidad?</h3>
              <ul className="grid sm:grid-cols-2 gap-4">
                {INCLUDES.map(({ title, body, icon: Icon }) => (
                  <li
                    key={title}
                    className="bg-(--cat-dark)/85 backdrop-blur-sm border border-(--cat-yellow)/25 rounded-2xl p-5"
                  >
                    <Icon />
                    <p className="font-semibold text-lg mt-3 mb-1">{title}</p>
                    <p className="text-(--cat-yellow)/85 leading-relaxed">{body}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Packs y tarifas */}
      <section id="packs" className="bg-(--cat-yellow-light) text-(--cat-black) scroll-mt-4">
        <SectionBand title="Packs y tarifas" />
        <div className="max-w-6xl mx-auto px-6 py-14 md:py-20">
          {/* Tabla en escritorio, tarjetas en celular */}
          <div className="hidden md:block overflow-hidden border-2 border-(--cat-black)">
            <table className="w-full text-center">
              <thead className="bg-(--cat-black) text-(--cat-yellow)">
                <tr>
                  <th className="py-5 px-3 font-normal">Pack</th>
                  <th className="py-5 px-3 font-normal">Cantidad</th>
                  <th className="py-5 px-3 font-normal">
                    Precio unitario
                    <br />
                    solo QR
                  </th>
                  <th className="py-5 px-3 font-normal">QR + NFC</th>
                  <th className="py-5 px-3 font-normal">Ideal para</th>
                </tr>
              </thead>
              <tbody className="bg-(--cat-yellow)">
                {PACKS.map((p) => (
                  <tr key={p.name} className="border-t-2 border-(--cat-black)">
                    <td className="py-6 px-3 uppercase font-semibold tracking-wide border-r-2 border-(--cat-black)">
                      {p.name}
                    </td>
                    <td className="py-6 px-3 border-r-2 border-(--cat-black)">{p.units}</td>
                    <td className="py-6 px-3 border-r-2 border-(--cat-black) text-lg">
                      {p.qr} <span className="text-sm">c/u</span>
                    </td>
                    <td className="py-6 px-3 border-r-2 border-(--cat-black) text-lg font-semibold">
                      {p.nfc} <span className="text-sm font-normal">c/u</span>
                    </td>
                    <td className="py-6 px-4 text-left">{p.idealFor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="md:hidden flex flex-col gap-4">
            {PACKS.map((p) => (
              <li key={p.name} className="bg-(--cat-yellow) border-2 border-(--cat-black)">
                <div className="bg-(--cat-black) text-(--cat-yellow) px-5 py-3 flex flex-wrap justify-between items-baseline gap-x-3">
                  <span className="catalog-display text-xl">{p.name}</span>
                  <span className="text-sm whitespace-nowrap">{p.units}</span>
                </div>
                <div className="grid grid-cols-2 border-b-2 border-(--cat-black)">
                  <div className="p-4 border-r-2 border-(--cat-black)">
                    <p className="text-xs uppercase tracking-wide">Solo QR</p>
                    <p className="text-2xl">
                      {p.qr} <span className="text-sm">c/u</span>
                    </p>
                  </div>
                  <div className="p-4">
                    <p className="text-xs uppercase tracking-wide">QR + NFC</p>
                    <p className="text-2xl font-semibold">
                      {p.nfc} <span className="text-sm font-normal">c/u</span>
                    </p>
                  </div>
                </div>
                <p className="px-5 py-3 text-sm">
                  <span className="font-semibold">Ideal para: </span>
                  {p.idealFor}
                </p>
              </li>
            ))}
          </ul>

          <ul className="mt-10 grid md:grid-cols-2 gap-4 text-lg md:text-xl">
            <li className="flex gap-3">
              <span aria-hidden>•</span>
              Tiempo de producción: 10/15 días hábiles una vez aprobado el diseño.
            </li>
            <li className="flex gap-3">
              <span aria-hidden>•</span>
              Envíos a todo el país o retiro/entrega a coordinar.
            </li>
          </ul>
        </div>
      </section>

      {/* ¿Cómo hacer tu pedido? */}
      <section id="pedido" className="scroll-mt-4">
        <SectionBand title="¿Cómo hacer tu pedido?" align="left" />
        <div className="relative">
          <TextureBackground />
          <div className="relative max-w-6xl mx-auto px-6 py-14 md:py-20">
            <ol className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {STEPS.map((step, i) => (
                <li
                  key={step.title}
                  className="bg-(--cat-dark)/85 backdrop-blur-sm border border-(--cat-yellow)/25 rounded-2xl p-6"
                >
                  <span className="catalog-display text-5xl text-(--cat-yellow)">{i + 1}</span>
                  <p className="font-semibold text-xl mt-4 mb-2">{step.title}</p>
                  <p className="text-(--cat-yellow)/85 leading-relaxed">{step.body}</p>
                </li>
              ))}
            </ol>

            <div id="contacto" className="mt-14 flex flex-col md:flex-row md:items-center gap-6 md:gap-10">
              <p className="text-2xl font-semibold">Contacto directo / Pedidos:</p>
              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 bg-(--cat-yellow) text-(--cat-black) hover:bg-(--cat-yellow-light) transition-colors font-semibold rounded-full px-6 py-3"
                >
                  <IconWhatsapp />
                  WhatsApp: 11 5863-8981
                </a>
                <a
                  href={INSTAGRAM_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 border-2 border-(--cat-yellow) hover:bg-(--cat-yellow)/10 transition-colors font-semibold rounded-full px-6 py-3"
                >
                  <IconInstagram />
                  @vinilitos.play
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Algunos trabajos */}
      <section id="trabajos" className="bg-(--cat-dark) scroll-mt-4">
        <SectionBand title="Algunos trabajos" />
        <div className="max-w-6xl mx-auto px-6 py-14 md:py-20">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="relative col-span-2 md:row-span-2 aspect-square overflow-hidden group">
              <Image
                src="/landing/trabajos-mesa.webp"
                alt="Varios vinilitos de distintas bandas sobre una mesa"
                fill
                sizes="(min-width: 1152px) 736px, (min-width: 768px) 66vw, 100vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
            {WORKS.map((w) => (
              <div key={w.src} className="relative aspect-square max-md:last:col-span-2 max-md:last:aspect-[2/1] overflow-hidden group">
                <Image
                  src={w.src}
                  alt={w.alt}
                  fill
                  sizes="(min-width: 768px) 33vw, 50vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-(--cat-yellow) text-(--cat-black) py-10 px-6 text-center">
        <p className="catalog-display text-2xl mb-2">Vinilitos</p>
        <p className="text-sm mb-4">Merchandising físico e interactivo para tu Banda</p>
        <div className="flex justify-center gap-6 text-sm font-semibold">
          <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className="underline">
            WhatsApp
          </a>
          <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer" className="underline">
            Instagram
          </a>
        </div>
      </footer>
    </main>
  );
}

function SectionBand({ title, align = "right" }: { title: string; align?: "left" | "right" }) {
  return (
    <div className="bg-(--cat-yellow) text-(--cat-black)">
      <h2
        className={`catalog-display max-w-6xl mx-auto px-6 py-8 md:py-10 text-[6.5vw] sm:text-4xl md:text-5xl leading-tight ${
          align === "right" ? "text-right" : "text-left"
        }`}
      >
        {title}
      </h2>
    </div>
  );
}

function TextureBackground() {
  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden">
      <Image
        src="/landing/discos-textura.webp"
        alt=""
        fill
        sizes="100vw"
        className="object-cover opacity-70"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-(--cat-dark) via-(--cat-dark)/60 to-(--cat-black)/40" />
    </div>
  );
}

function IconArt() {
  return (
    <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-5-5L5 21" />
    </svg>
  );
}

function IconQr() {
  return (
    <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <path d="M14 14h3v3h-3zM20 14v.01M14 20h.01M17 20h4v-3" />
    </svg>
  );
}

function IconNfc() {
  return (
    <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M6 8.3a6 6 0 0 1 0 7.4M9.5 5.5a10 10 0 0 1 0 13M13 3a14 14 0 0 1 0 18" />
    </svg>
  );
}

function IconLink() {
  return (
    <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" />
      <path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" />
    </svg>
  );
}

function IconWhatsapp() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor" aria-hidden>
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.1 5.1 0 0 0 1.1 2.7 11.6 11.6 0 0 0 4.4 3.9c1.6.7 2.3.8 3.1.6a2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .1-1.3c0-.1-.2-.2-.4-.3Z" />
    </svg>
  );
}

function IconInstagram() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" />
    </svg>
  );
}
