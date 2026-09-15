import Link from "next/link";
import VinylDisc from "@/components/VinylDisc";

export default function Home() {
  return (
    <main className="flex-1">
      <section className="max-w-5xl mx-auto px-6 pt-20 pb-16 flex flex-col-reverse md:flex-row items-center gap-12">
        <div className="flex-1 text-center md:text-left">
          <p className="uppercase tracking-[0.3em] text-vinyl-accent text-xs mb-4">
            Vinilitos · Páginas
          </p>
          <h1 className="font-display text-4xl md:text-5xl font-semibold leading-tight mb-6">
            Un solo link para todos tus links.
          </h1>
          <p className="text-vinyl-cream-dim text-lg mb-8 max-w-md mx-auto md:mx-0">
            Activá tu vinilito y creá en minutos tu propia página con Spotify,
            YouTube y todas las plataformas donde suena tu música. Sin pagar
            Carrd, sin complicarte.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
            <Link
              href="/activar"
              className="bg-vinyl-accent hover:bg-vinyl-accent-dim transition-colors text-vinyl-black font-semibold px-6 py-3 rounded-full text-center"
            >
              Activar mi vinilito
            </Link>
            <a
              href="https://www.instagram.com/vinilitos.play/"
              target="_blank"
              rel="noreferrer"
              className="border border-vinyl-line hover:border-vinyl-accent transition-colors px-6 py-3 rounded-full text-center"
            >
              Conocer Vinilitos
            </a>
          </div>
        </div>
        <VinylDisc label="Tu álbum acá" size={260} />
      </section>

      <section className="max-w-5xl mx-auto px-6 py-16 border-t border-vinyl-line">
        <h2 className="font-display text-2xl md:text-3xl text-center mb-12">
          Cómo funciona
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              step: "1",
              title: "Comprás tus vinilitos",
              body: "Cada vinilito físico trae un código NFC/QR único de activación, listo para revender junto a tu música.",
            },
            {
              step: "2",
              title: "Activás tu código",
              body: "Escaneás o ingresás el código, ponés el nombre de tu proyecto y creamos tu página al instante.",
            },
            {
              step: "3",
              title: "Cargás tus links",
              body: "Pegás tus links de Spotify, YouTube, SoundCloud, Apple Music o donde sea. Traemos portada y título solos.",
            },
          ].map((item) => (
            <div key={item.step} className="text-center md:text-left">
              <div className="w-10 h-10 rounded-full bg-vinyl-accent text-vinyl-black font-semibold flex items-center justify-center mb-4 mx-auto md:mx-0">
                {item.step}
              </div>
              <h3 className="font-display text-lg mb-2">{item.title}</h3>
              <p className="text-vinyl-cream-dim text-sm leading-relaxed">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-6 py-16 border-t border-vinyl-line text-center">
        <h2 className="font-display text-2xl md:text-3xl mb-4">
          $3.999 por año, todo incluido
        </h2>
        <p className="text-vinyl-cream-dim mb-8">
          Tu página propia, sin límite de links, sin marca de agua de
          terceros. Incluida al activar tus vinilitos.
        </p>
        <Link
          href="/activar"
          className="inline-block bg-vinyl-accent hover:bg-vinyl-accent-dim transition-colors text-vinyl-black font-semibold px-8 py-3 rounded-full"
        >
          Activar ahora
        </Link>
      </section>

      <footer className="mt-auto py-8 text-center text-vinyl-cream-dim text-xs border-t border-vinyl-line">
        Vinilitos · vinilos impresos en 3D con NFC para músicos independientes
      </footer>
    </main>
  );
}
