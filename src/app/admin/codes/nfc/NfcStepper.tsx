"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { buildActivationUrl } from "@/lib/activationUrl";

interface CodeItem {
  code: string;
  used: boolean;
  nfcWritten: boolean;
}

function firstPendingIndex(codes: CodeItem[], from = 0): number {
  for (let i = from; i < codes.length; i++) {
    if (!codes[i].nfcWritten) return i;
  }
  for (let i = 0; i < from; i++) {
    if (!codes[i].nfcWritten) return i;
  }
  return from;
}

export default function NfcStepper({ batchName }: { batchName: string }) {
  const [codes, setCodes] = useState<CodeItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const [marking, setMarking] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(
          `/api/admin/codes?batchName=${encodeURIComponent(batchName)}`
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Error al cargar los códigos.");
        if (cancelled) return;
        const list: CodeItem[] = data.codes;
        setCodes(list);
        setIndex(firstPendingIndex(list));
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Error de red.");
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [batchName]);

  async function setNfcWritten(code: string, nfcWritten: boolean) {
    setMarking(true);
    try {
      const res = await fetch("/api/admin/codes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, nfcWritten }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "No se pudo actualizar.");
        return;
      }
      setCodes((prev) =>
        prev
          ? prev.map((c) => (c.code === code ? { ...c, nfcWritten } : c))
          : prev
      );
    } catch {
      setError("Error de red.");
    } finally {
      setMarking(false);
    }
  }

  async function handleMarkAndNext() {
    if (!codes) return;
    const current = codes[index];
    await setNfcWritten(current.code, true);
    setIndex((i) => firstPendingIndex(codes, i + 1));
  }

  if (error) {
    return <p className="text-vinyl-accent text-sm">{error}</p>;
  }
  if (!codes) {
    return <p className="text-vinyl-cream-dim text-sm">Cargando...</p>;
  }
  if (codes.length === 0) {
    return (
      <p className="text-vinyl-cream-dim text-sm">
        No hay códigos en la tirada &quot;{batchName}&quot;.
      </p>
    );
  }

  const current = codes[index];
  const doneCount = codes.filter((c) => c.nfcWritten).length;
  const allDone = doneCount === codes.length;

  return (
    <div>
      <p className="uppercase tracking-[0.3em] text-vinyl-accent text-xs mb-2">
        Grabar NFC
      </p>
      <h1 className="font-display text-2xl mb-1">{batchName}</h1>
      <p className="text-vinyl-cream-dim text-sm mb-6">
        {doneCount}/{codes.length} grabados
        {allDone && " — ¡completo!"}
      </p>

      <div className="bg-vinyl-black-soft border border-vinyl-line rounded-2xl p-6 flex flex-col items-center gap-4">
        <div className="bg-white rounded-xl p-4">
          <QRCodeSVG value={buildActivationUrl(current.code)} size={220} />
        </div>
        <p className="font-mono text-lg tracking-wide">{current.code}</p>
        <p className="text-xs text-vinyl-cream-dim">
          {current.nfcWritten ? "✓ Ya grabado" : "Pendiente de grabar"}
          {current.used && " · ya activado por un músico"}
        </p>

        <div className="flex gap-3 w-full mt-2">
          <button
            type="button"
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            disabled={index === 0}
            className="flex-1 border border-vinyl-line hover:border-vinyl-accent disabled:opacity-40 transition-colors rounded-full px-4 py-3"
          >
            ← Anterior
          </button>
          <button
            type="button"
            onClick={() => setIndex((i) => Math.min(codes.length - 1, i + 1))}
            disabled={index === codes.length - 1}
            className="flex-1 border border-vinyl-line hover:border-vinyl-accent disabled:opacity-40 transition-colors rounded-full px-4 py-3"
          >
            Siguiente →
          </button>
        </div>

        {current.nfcWritten ? (
          <button
            type="button"
            onClick={() => setNfcWritten(current.code, false)}
            disabled={marking}
            className="w-full border border-vinyl-line hover:border-vinyl-accent disabled:opacity-60 transition-colors rounded-full px-4 py-3"
          >
            Desmarcar
          </button>
        ) : (
          <button
            type="button"
            onClick={handleMarkAndNext}
            disabled={marking}
            className="w-full bg-vinyl-accent hover:bg-vinyl-accent-dim disabled:opacity-60 transition-colors text-vinyl-black font-semibold rounded-full px-4 py-3"
          >
            {marking ? "Guardando..." : "Marcar grabado y siguiente"}
          </button>
        )}
      </div>

      <div className="mt-6">
        <p className="text-xs uppercase tracking-wide text-vinyl-cream-dim mb-2">
          Todos los códigos
        </p>
        <div className="flex flex-wrap gap-2">
          {codes.map((c, i) => (
            <button
              key={c.code}
              type="button"
              onClick={() => setIndex(i)}
              className={`text-xs font-mono px-2 py-1 rounded border transition-colors ${
                i === index
                  ? "border-vinyl-accent text-vinyl-accent"
                  : c.nfcWritten
                    ? "border-vinyl-line text-vinyl-cream-dim line-through"
                    : "border-vinyl-line text-vinyl-cream"
              }`}
            >
              {c.code.replace("VNLT-", "")}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
