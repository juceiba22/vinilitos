"use client";

import { useState } from "react";

export type ReleaseType = "album" | "single";

export interface TrackItem {
  // Clave local para React; las canciones se guardan todas juntas.
  key: string;
  title: string;
  lyrics: string;
}

let nextKey = 0;
export function newTrackKey(): string {
  nextKey += 1;
  return `t${Date.now()}-${nextKey}`;
}

export default function LyricsTab({
  pageId,
  albumTitle,
  initialReleaseType,
  initialTracks,
}: {
  pageId: string;
  albumTitle: string;
  initialReleaseType: ReleaseType;
  initialTracks: TrackItem[];
}) {
  const [releaseType, setReleaseType] = useState<ReleaseType>(initialReleaseType);
  const [tracks, setTracks] = useState<TrackItem[]>(
    initialTracks.length
      ? initialTracks
      : [{ key: newTrackKey(), title: albumTitle, lyrics: "" }]
  );
  const [openKey, setOpenKey] = useState<string | null>(tracks[0]?.key ?? null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const visibleTracks = releaseType === "single" ? tracks.slice(0, 1) : tracks;

  function updateTrack(key: string, patch: Partial<TrackItem>) {
    setTracks((ts) => ts.map((t) => (t.key === key ? { ...t, ...patch } : t)));
  }

  function addTrack() {
    const track = { key: newTrackKey(), title: "", lyrics: "" };
    setTracks((ts) => [...ts, track]);
    setOpenKey(track.key);
  }

  function removeTrack(key: string) {
    setTracks((ts) => ts.filter((t) => t.key !== key));
  }

  function moveTrack(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= tracks.length) return;
    setTracks((ts) => {
      const next = [...ts];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/pages/${pageId}/tracks`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          releaseType,
          tracks: visibleTracks.map((t) => ({ title: t.title, lyrics: t.lyrics })),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "No se pudieron guardar las letras.");
        return;
      }
      if (releaseType === "single") setTracks((ts) => ts.slice(0, 1));
      setMessage("Letras guardadas.");
    } catch {
      setError("Error de red al guardar las letras.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mb-10">
      <p className="text-xs uppercase tracking-wide text-vinyl-cream-dim mb-2">
        ¿Qué es este lanzamiento?
      </p>
      <div className="inline-flex rounded-lg border border-vinyl-line p-1 mb-6">
        {(
          [
            ["album", "Álbum / EP"],
            ["single", "Canción"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setReleaseType(value)}
            className={`px-4 py-1.5 rounded-md text-sm transition-colors ${
              releaseType === value
                ? "bg-vinyl-accent text-vinyl-black font-semibold"
                : "text-vinyl-cream-dim hover:text-vinyl-cream"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {releaseType === "single" && tracks.length > 1 && (
        <p className="text-vinyl-cream-dim text-xs mb-4">
          Como es una sola canción, al guardar se conserva solo la primera
          ({tracks[0].title || "sin título"}).
        </p>
      )}

      <ul className="flex flex-col gap-3 mb-4">
        {visibleTracks.map((track, i) => {
          const open = releaseType === "single" || openKey === track.key;
          return (
            <li
              key={track.key}
              className="bg-vinyl-black-soft border border-vinyl-line rounded-lg p-3"
            >
              <div className="flex items-center gap-2">
                {releaseType === "album" && (
                  <span className="text-vinyl-cream-dim text-xs w-6 text-right shrink-0">
                    {i + 1}.
                  </span>
                )}
                <input
                  className="input flex-1"
                  placeholder="Título de la canción"
                  value={track.title}
                  onChange={(e) => updateTrack(track.key, { title: e.target.value })}
                />
                {releaseType === "album" && (
                  <div className="flex gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => setOpenKey(open ? null : track.key)}
                      className="h-7 px-2 rounded hover:bg-vinyl-line text-xs text-vinyl-cream-dim"
                    >
                      {open ? "Cerrar" : track.lyrics ? "Ver letra" : "Cargar letra"}
                    </button>
                    <button
                      type="button"
                      onClick={() => moveTrack(i, -1)}
                      className="w-7 h-7 rounded hover:bg-vinyl-line"
                      aria-label="Subir"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => moveTrack(i, 1)}
                      className="w-7 h-7 rounded hover:bg-vinyl-line"
                      aria-label="Bajar"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={() => removeTrack(track.key)}
                      className="w-7 h-7 rounded hover:bg-vinyl-line text-vinyl-accent"
                      aria-label="Quitar"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
              {open && (
                <textarea
                  className="input mt-3 min-h-64 resize-y font-mono text-sm leading-relaxed"
                  placeholder="Pegá la letra acá. Dejá una línea en blanco entre estrofas."
                  value={track.lyrics}
                  onChange={(e) => updateTrack(track.key, { lyrics: e.target.value })}
                />
              )}
            </li>
          );
        })}
      </ul>

      {releaseType === "album" && (
        <button
          type="button"
          onClick={addTrack}
          className="border border-dashed border-vinyl-line hover:border-vinyl-accent transition-colors rounded-lg px-4 py-2 text-sm w-full mb-6"
        >
          + Agregar canción
        </button>
      )}

      {error && <p className="text-vinyl-accent text-sm mb-3">{error}</p>}
      {message && <p className="text-sm mb-3">{message}</p>}

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="border border-vinyl-line hover:border-vinyl-accent disabled:opacity-60 transition-colors rounded-lg px-4 py-2 text-sm"
      >
        {saving ? "Guardando..." : "Guardar letras"}
      </button>
    </section>
  );
}
