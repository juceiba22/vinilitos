"use client";

import { useState } from "react";
import type { Credit } from "@/lib/credits";

const ROLE_SUGGESTIONS = [
  "Voz",
  "Guitarras",
  "Bajo",
  "Batería",
  "Teclados",
  "Coros",
  "Percusión",
  "Producción",
  "Grabación",
  "Mezcla",
  "Mastering",
  "Arte de tapa",
  "Fotografía",
];

interface CreditRow extends Credit {
  key: string;
}

let nextKey = 0;
function newKey(): string {
  nextKey += 1;
  return `c${Date.now()}-${nextKey}`;
}

export default function InfoTab({
  pageId,
  initialRecordedAt,
  initialThanks,
  initialCredits,
}: {
  pageId: string;
  initialRecordedAt: string;
  initialThanks: string;
  initialCredits: Credit[];
}) {
  const [recordedAt, setRecordedAt] = useState(initialRecordedAt);
  const [thanks, setThanks] = useState(initialThanks);
  const [credits, setCredits] = useState<CreditRow[]>(() =>
    initialCredits.length
      ? initialCredits.map((c) => ({ ...c, key: newKey() }))
      : [{ role: "", names: "", key: newKey() }]
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function updateCredit(key: string, patch: Partial<Credit>) {
    setCredits((cs) => cs.map((c) => (c.key === key ? { ...c, ...patch } : c)));
  }

  function moveCredit(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= credits.length) return;
    setCredits((cs) => {
      const next = [...cs];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/pages/${pageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recordedAt,
          thanks,
          credits: credits.map(({ role, names }) => ({ role, names })),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "No se pudo guardar la info.");
        return;
      }
      setMessage("Info guardada.");
    } catch {
      setError("Error de red al guardar la info.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="grid gap-6 mb-10">
      <div>
        <h2 className="font-display text-xl mb-1">Participantes</h2>
        <p className="text-vinyl-cream-dim text-xs mb-3">
          Un rol por fila, por ejemplo &quot;Guitarras: Juan Pérez&quot; o
          &quot;Coros: Ana, Sofía&quot;.
        </p>
        <datalist id="credit-roles">
          {ROLE_SUGGESTIONS.map((r) => (
            <option key={r} value={r} />
          ))}
        </datalist>
        <ul className="flex flex-col gap-2 mb-3">
          {credits.map((credit, i) => (
            <li key={credit.key} className="flex gap-2 items-center">
              <input
                className="input w-2/5!"
                list="credit-roles"
                placeholder="Rol (ej. Guitarras)"
                value={credit.role}
                onChange={(e) => updateCredit(credit.key, { role: e.target.value })}
              />
              <input
                className="input flex-1"
                placeholder="Nombre/s"
                value={credit.names}
                onChange={(e) => updateCredit(credit.key, { names: e.target.value })}
              />
              <div className="flex gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => moveCredit(i, -1)}
                  className="w-7 h-7 rounded hover:bg-vinyl-line"
                  aria-label="Subir"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => moveCredit(i, 1)}
                  className="w-7 h-7 rounded hover:bg-vinyl-line"
                  aria-label="Bajar"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => setCredits((cs) => cs.filter((c) => c.key !== credit.key))}
                  className="w-7 h-7 rounded hover:bg-vinyl-line text-vinyl-accent"
                  aria-label="Quitar"
                >
                  ✕
                </button>
              </div>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={() => setCredits((cs) => [...cs, { role: "", names: "", key: newKey() }])}
          className="border border-dashed border-vinyl-line hover:border-vinyl-accent transition-colors rounded-lg px-4 py-2 text-sm w-full"
        >
          + Agregar participante
        </button>
      </div>

      <label className="block">
        <span className="text-xs uppercase tracking-wide text-vinyl-cream-dim block mb-1">
          Grabado en
        </span>
        <input
          className="input"
          placeholder="Ej. Estudio El Árbol, Buenos Aires — marzo 2026"
          value={recordedAt}
          onChange={(e) => setRecordedAt(e.target.value)}
        />
      </label>

      <label className="block">
        <span className="text-xs uppercase tracking-wide text-vinyl-cream-dim block mb-1">
          Agradecimientos
        </span>
        <textarea
          className="input min-h-32 resize-y"
          value={thanks}
          onChange={(e) => setThanks(e.target.value)}
        />
      </label>

      <div>
        {error && <p className="text-vinyl-accent text-sm mb-3">{error}</p>}
        {message && <p className="text-sm mb-3">{message}</p>}
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="border border-vinyl-line hover:border-vinyl-accent disabled:opacity-60 transition-colors rounded-lg px-4 py-2 text-sm"
        >
          {saving ? "Guardando..." : "Guardar info"}
        </button>
      </div>
    </section>
  );
}
