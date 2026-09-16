"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewArtistPageForm() {
  const router = useRouter();
  const [artistName, setArtistName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!artistName.trim()) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ artistName: artistName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo crear la página.");
        setLoading(false);
        return;
      }
      router.push(`/admin/pages/${data.id}/edit`);
    } catch {
      setError("Error de red.");
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-vinyl-black-soft border border-vinyl-line rounded-xl p-4 flex flex-wrap gap-3 items-end"
    >
      <label className="flex-1 min-w-[220px]">
        <span className="text-xs uppercase tracking-wide text-vinyl-cream-dim block mb-1">
          Nombre del artista
        </span>
        <input
          className="input"
          value={artistName}
          onChange={(e) => setArtistName(e.target.value)}
          placeholder="Ej: Facundo Bronstein"
          required
        />
      </label>
      <button
        type="submit"
        disabled={loading}
        className="bg-vinyl-accent hover:bg-vinyl-accent-dim disabled:opacity-60 transition-colors text-vinyl-black font-semibold rounded-lg px-5 py-3 whitespace-nowrap"
      >
        {loading ? "Creando..." : "Nueva página de artista"}
      </button>
      {error && <p className="text-vinyl-accent text-sm w-full">{error}</p>}
    </form>
  );
}
