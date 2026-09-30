"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Eliminar una página es irreversible, así que pide dos pasos: el link
// "eliminar" solo abre la confirmación, y recién el segundo botón borra.
export default function DeletePageButton({
  pageId,
  artistName,
}: {
  pageId: string;
  artistName: string;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function close() {
    if (deleting) return;
    setConfirming(false);
    setError(null);
  }

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/pages/${pageId}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        setError(json?.error ?? "No se pudo eliminar la página.");
        return;
      }
      setConfirming(false);
      router.refresh();
    } catch {
      setError("Error de red al eliminar la página.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="underline text-red-400 hover:text-red-300"
      >
        eliminar
      </button>

      {confirming && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6"
          onClick={close}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby={`delete-title-${pageId}`}
            className="w-full max-w-md bg-vinyl-black-soft border border-vinyl-line rounded-xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id={`delete-title-${pageId}`} className="font-display text-xl mb-3">
              ¿Estás seguro que querés eliminar la página del artista{" "}
              <span className="text-vinyl-accent">{artistName}</span>?
            </h2>
            <p className="text-vinyl-cream-dim text-sm mb-6">
              Se borran sus links, letras, info y fotos de Backstage, y los
              códigos QR/NFC de sus vinilitos dejan de funcionar. Esta acción
              no se puede deshacer.
            </p>
            {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={close}
                disabled={deleting}
                autoFocus
                className="border border-vinyl-line hover:border-vinyl-cream-dim disabled:opacity-60 transition-colors rounded-lg px-4 py-2 text-sm"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="bg-red-600 hover:bg-red-500 disabled:opacity-60 transition-colors text-white font-semibold rounded-lg px-4 py-2 text-sm"
              >
                {deleting ? "Eliminando..." : "Sí, eliminar página"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
