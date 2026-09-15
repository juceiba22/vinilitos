"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import QrCodeGrid from "./QrCodeGrid";

export interface Batch {
  batchName: string;
  total: number;
  used: number;
  createdAt: Date | string;
}

interface QrConfig {
  listApiUrl: string;
}

export default function BatchCodesPanel({
  apiUrl,
  activateHint,
  batches,
  qr,
}: {
  apiUrl: string;
  activateHint: string;
  batches: Batch[];
  qr?: QrConfig;
}) {
  const router = useRouter();
  const [batchName, setBatchName] = useState("");
  const [quantity, setQuantity] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generated, setGenerated] = useState<string[] | null>(null);
  const [generatedBatchName, setGeneratedBatchName] = useState("");

  const [viewingBatch, setViewingBatch] = useState<string | null>(null);
  const [viewingCodes, setViewingCodes] = useState<string[] | null>(null);
  const [viewingLoading, setViewingLoading] = useState(false);
  const [viewingError, setViewingError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setGenerated(null);
    setLoading(true);
    try {
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batchName, quantity }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo generar el lote.");
        return;
      }
      setGenerated(data.codes);
      setGeneratedBatchName(batchName);
      setBatchName("");
      router.refresh();
    } catch {
      setError("Error de red.");
    } finally {
      setLoading(false);
    }
  }

  async function handleViewCodes(targetBatchName: string) {
    if (!qr) return;
    if (viewingBatch === targetBatchName) {
      setViewingBatch(null);
      setViewingCodes(null);
      return;
    }
    setViewingBatch(targetBatchName);
    setViewingCodes(null);
    setViewingError(null);
    setViewingLoading(true);
    try {
      const res = await fetch(
        `${qr.listApiUrl}?batchName=${encodeURIComponent(targetBatchName)}`
      );
      const data = await res.json();
      if (!res.ok) {
        setViewingError(data.error ?? "No se pudieron cargar los códigos.");
        return;
      }
      setViewingCodes(
        (data.codes as { code: string }[]).map((c) => c.code)
      );
    } catch {
      setViewingError("Error de red.");
    } finally {
      setViewingLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <form
        onSubmit={handleSubmit}
        className="bg-vinyl-black-soft border border-vinyl-line rounded-xl p-4 flex flex-wrap gap-3 items-end print:hidden"
      >
        <label className="flex-1 min-w-[200px]">
          <span className="text-xs uppercase tracking-wide text-vinyl-cream-dim block mb-1">
            Nombre de la tirada
          </span>
          <input
            className="input"
            value={batchName}
            onChange={(e) => setBatchName(e.target.value)}
            placeholder='Ej: "Facundo Bronstein Vol.1"'
            required
          />
        </label>
        <label className="w-28">
          <span className="text-xs uppercase tracking-wide text-vinyl-cream-dim block mb-1">
            Cantidad
          </span>
          <input
            type="number"
            min={1}
            max={500}
            className="input"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            required
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="bg-vinyl-accent hover:bg-vinyl-accent-dim disabled:opacity-60 transition-colors text-vinyl-black font-semibold rounded-lg px-5 py-3"
        >
          {loading ? "Generando..." : "Generar códigos"}
        </button>
      </form>

      {error && <p className="text-vinyl-accent text-sm print:hidden">{error}</p>}

      {generated && (
        <div className="bg-vinyl-black-soft border border-vinyl-line rounded-xl p-4 print:hidden">
          <p className="text-sm mb-2">
            {generated.length} códigos generados. {activateHint}
          </p>
          <textarea
            readOnly
            className="input min-h-32 font-mono text-xs mb-4"
            value={generated.join("\n")}
            onFocus={(e) => e.target.select()}
          />
          {qr && <QrCodeGrid codes={generated} title={generatedBatchName} />}
        </div>
      )}

      <div className="print:hidden">
        <h2 className="font-display text-xl mb-3">Tiradas existentes</h2>
        {batches.length === 0 ? (
          <p className="text-vinyl-cream-dim text-sm">
            Todavía no generaste ningún código.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-vinyl-cream-dim border-b border-vinyl-line">
                  <th className="py-2 pr-4">Tirada</th>
                  <th className="py-2 pr-4">Usados</th>
                  <th className="py-2 pr-4">Total</th>
                  <th className="py-2 pr-4">Última actividad</th>
                  {qr && <th className="py-2"></th>}
                </tr>
              </thead>
              <tbody>
                {batches.map((b) => (
                  <tr key={b.batchName} className="border-b border-vinyl-line/50">
                    <td className="py-2 pr-4">{b.batchName}</td>
                    <td className="py-2 pr-4">{b.used}</td>
                    <td className="py-2 pr-4">{b.total}</td>
                    <td className="py-2 pr-4">
                      {new Date(b.createdAt).toLocaleDateString("es-AR")}
                    </td>
                    {qr && (
                      <td className="py-2">
                        <button
                          type="button"
                          onClick={() => handleViewCodes(b.batchName)}
                          className="underline text-vinyl-cream-dim hover:text-vinyl-cream"
                        >
                          {viewingBatch === b.batchName ? "Ocultar" : "Ver QR"}
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {qr && viewingBatch && (
        <div className="bg-vinyl-black-soft border border-vinyl-line rounded-xl p-4 print:bg-white print:border-0 print:p-0">
          {viewingLoading && (
            <p className="text-vinyl-cream-dim text-sm print:hidden">Cargando...</p>
          )}
          {viewingError && (
            <p className="text-vinyl-accent text-sm print:hidden">{viewingError}</p>
          )}
          {viewingCodes && (
            <QrCodeGrid codes={viewingCodes} title={viewingBatch} />
          )}
        </div>
      )}
    </div>
  );
}
