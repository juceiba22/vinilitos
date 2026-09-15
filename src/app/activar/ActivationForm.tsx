"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function ActivationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [code, setCode] = useState(searchParams.get("code") ?? "");
  const [artistName, setArtistName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/activation/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, artistName, contactEmail }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo activar el código.");
        setLoading(false);
        return;
      }
      router.push(data.editUrl);
    } catch {
      setError("Ocurrió un error de red. Probá de nuevo.");
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-vinyl-black-soft border border-vinyl-line rounded-2xl p-6 flex flex-col gap-4"
    >
      <div>
        <label className="text-xs uppercase tracking-wide text-vinyl-cream-dim block mb-1">
          Código de activación
        </label>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="EJ: VNLT-8F3K2"
          required
          className="w-full bg-vinyl-black border border-vinyl-line rounded-lg px-4 py-3 uppercase tracking-widest text-center outline-none focus:border-vinyl-accent transition-colors"
        />
      </div>
      <div>
        <label className="text-xs uppercase tracking-wide text-vinyl-cream-dim block mb-1">
          Nombre de artista o álbum
        </label>
        <input
          value={artistName}
          onChange={(e) => setArtistName(e.target.value)}
          placeholder="Ej: Facundo Bronstein"
          required
          className="w-full bg-vinyl-black border border-vinyl-line rounded-lg px-4 py-3 outline-none focus:border-vinyl-accent transition-colors"
        />
      </div>
      <div>
        <label className="text-xs uppercase tracking-wide text-vinyl-cream-dim block mb-1">
          Mail (opcional, para avisarte antes de que venza)
        </label>
        <input
          type="email"
          value={contactEmail}
          onChange={(e) => setContactEmail(e.target.value)}
          placeholder="tu@mail.com"
          className="w-full bg-vinyl-black border border-vinyl-line rounded-lg px-4 py-3 outline-none focus:border-vinyl-accent transition-colors"
        />
      </div>
      {error && (
        <p className="text-vinyl-accent text-sm text-center">{error}</p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="bg-vinyl-accent hover:bg-vinyl-accent-dim disabled:opacity-60 transition-colors text-vinyl-black font-semibold rounded-full px-6 py-3 mt-2"
      >
        {loading ? "Activando..." : "Crear mi página"}
      </button>
    </form>
  );
}
