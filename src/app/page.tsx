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
            Encargá tus vinilitos con Spotify, YouTube y todas las
            plataformas donde suena tu música. Nosotros armamos tu página y
            grabamos el NFC de cada uno.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
            <a
              href="https://www.instagram.com/vinilitos.play/"
              target="_blank"
              rel="noreferrer"
              className="bg-vinyl-accent hover:bg-vinyl-accent-dim transition-colors text-vinyl-black font-semibold px-6 py-3 rounded-full text-center"
            >
              Encargar mis vinilitos
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
              title: "Nos encargás tus vinilitos",
              body: "Nos pasás tus links de Spotify, YouTube, SoundCloud o donde suene tu música, uno por cada vinilito.",
            },
            {
              step: "2",
              title: "Armamos tu página",
              body: "Cargamos cada tema con su portada y título, y grabamos un código NFC/QR único para cada vinilito físico.",
            },
            {
              step: "3",
              title: "Escaneás y sonás",
              body: "Cada vinilito lleva directo a su tema, y tenés tu propia página con todos tus links para compartir.",
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
          terceros. Incluida al encargar tus vinilitos.
        </p>
        <a
          href="https://www.instagram.com/vinilitos.play/"
          target="_blank"
          rel="noreferrer"
          className="inline-block bg-vinyl-accent hover:bg-vinyl-accent-dim transition-colors text-vinyl-black font-semibold px-8 py-3 rounded-full"
        >
          Encargar ahora
        </a>
      </section>

      <footer className="mt-auto py-8 text-center text-vinyl-cream-dim text-xs border-t border-vinyl-line">
        Vinilitos · vinilos impresos en 3D con NFC para músicos independientes
      </footer>
    </main>
  );
}
