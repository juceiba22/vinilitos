"use client";

import { useRef, useState } from "react";

export interface PhotoItem {
  id: string;
  url: string;
  caption: string | null;
}

const MAX_PHOTO_BYTES = 10 * 1024 * 1024;

export default function BackstageTab({
  pageId,
  r2Configured,
  initialPhotos,
}: {
  pageId: string;
  r2Configured: boolean;
  initialPhotos: PhotoItem[];
}) {
  const [photos, setPhotos] = useState<PhotoItem[]>(initialPhotos);
  const [uploading, setUploading] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function uploadOne(file: File): Promise<PhotoItem> {
    if (file.size > MAX_PHOTO_BYTES) {
      throw new Error(`"${file.name}" pesa más de 10 MB.`);
    }

    const urlRes = await fetch(`/api/admin/pages/${pageId}/photos/upload-url`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contentType: file.type, size: file.size }),
    });
    const urlJson = await urlRes.json();
    if (!urlRes.ok) throw new Error(urlJson.error ?? "No se pudo preparar la subida.");

    const putRes = await fetch(urlJson.uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    }).catch(() => null);
    // Si fetch falla sin respuesta, el navegador bloqueó el pedido: casi
    // siempre es CORS (el origen actual no está permitido en el bucket).
    if (!putRes) {
      throw new Error(
        `No se pudo subir "${file.name}" a R2: el bucket no acepta subidas desde ${window.location.origin}. Agregá ese origen a la política de CORS del bucket.`
      );
    }
    // Si R2 respondió con error, mostramos su código (p. ej.
    // SignatureDoesNotMatch si las claves R2_* del servidor están mal).
    if (!putRes.ok) {
      const body = await putRes.text().catch(() => "");
      const code = body.match(/<Code>([^<]+)<\/Code>/)?.[1];
      throw new Error(
        `R2 rechazó "${file.name}" (HTTP ${putRes.status}${code ? `: ${code}` : ""}). Revisá las variables R2_* del servidor.`
      );
    }

    const saveRes = await fetch(`/api/admin/pages/${pageId}/photos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: urlJson.key }),
    });
    const saveJson = await saveRes.json();
    if (!saveRes.ok) throw new Error(saveJson.error ?? "No se pudo guardar la foto.");
    return saveJson.photo;
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const list = Array.from(files);
    setError(null);
    setUploading({ done: 0, total: list.length });
    const errors: string[] = [];
    for (const file of list) {
      try {
        const photo = await uploadOne(file);
        setPhotos((ps) => [...ps, photo]);
      } catch (e) {
        errors.push(e instanceof Error ? e.message : "Error al subir una foto.");
      }
      setUploading((u) => (u ? { ...u, done: u.done + 1 } : u));
    }
    setUploading(null);
    if (errors.length) setError(errors.join(" "));
    if (inputRef.current) inputRef.current.value = "";
  }

  async function saveCaption(photo: PhotoItem, caption: string) {
    if ((photo.caption ?? "") === caption) return;
    setError(null);
    try {
      const res = await fetch(`/api/admin/pages/${pageId}/photos/${photo.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caption }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "No se pudo guardar el epígrafe.");
        return;
      }
      setPhotos((ps) => ps.map((p) => (p.id === photo.id ? json.photo : p)));
    } catch {
      setError("Error de red al guardar el epígrafe.");
    }
  }

  async function removePhoto(photoId: string) {
    if (!confirm("¿Borrar esta foto? No se puede deshacer.")) return;
    setError(null);
    try {
      const res = await fetch(`/api/admin/pages/${pageId}/photos/${photoId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        setError(json?.error ?? "No se pudo borrar la foto.");
        return;
      }
      setPhotos((ps) => ps.filter((p) => p.id !== photoId));
    } catch {
      setError("Error de red.");
    }
  }

  async function movePhoto(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= photos.length) return;
    const next = [...photos];
    [next[index], next[target]] = [next[target], next[index]];
    setPhotos(next);
    try {
      await fetch(`/api/admin/pages/${pageId}/photos/reorder`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedPhotoIds: next.map((p) => p.id) }),
      });
    } catch {
      setError("Error de red al reordenar.");
    }
  }

  return (
    <section className="mb-10">
      <h2 className="font-display text-xl mb-1">Backstage</h2>
      <p className="text-vinyl-cream-dim text-xs mb-4">
        Fotos del detrás de escena: ensayos, grabación, shows. JPG, PNG, WEBP,
        GIF o AVIF de hasta 10 MB. Las fotos, el orden y los epígrafes se
        guardan solos: no hace falta tocar ningún botón de guardar.
      </p>

      {!r2Configured ? (
        <p className="bg-vinyl-black-soft border border-vinyl-line rounded-lg p-4 text-sm text-vinyl-cream-dim">
          Falta configurar Cloudflare R2 (variables <code>R2_*</code> en{" "}
          <code>.env</code>) para poder subir fotos.
        </p>
      ) : (
        <label
          className={`flex flex-col items-center justify-center gap-1 border-2 border-dashed border-vinyl-line hover:border-vinyl-accent transition-colors rounded-xl p-6 mb-6 text-center cursor-pointer ${
            uploading ? "opacity-60 pointer-events-none" : ""
          }`}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            handleFiles(e.dataTransfer.files);
          }}
        >
          <span className="text-sm">
            {uploading
              ? `Subiendo ${uploading.done + 1} de ${uploading.total}...`
              : "Arrastrá fotos acá o hacé click para elegirlas"}
          </span>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </label>
      )}

      {error && <p className="text-vinyl-accent text-sm mb-4">{error}</p>}

      {photos.length === 0 ? (
        <p className="text-vinyl-cream-dim text-sm">Todavía no hay fotos.</p>
      ) : (
        <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {photos.map((photo, i) => (
            <li
              key={photo.id}
              className="bg-vinyl-black-soft border border-vinyl-line rounded-lg overflow-hidden flex flex-col"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.url}
                alt={photo.caption ?? ""}
                className="w-full aspect-square object-cover"
              />
              <div className="p-2 flex flex-col gap-2">
                <input
                  className="input text-xs py-1.5! px-2!"
                  placeholder="Epígrafe (opcional)"
                  defaultValue={photo.caption ?? ""}
                  onBlur={(e) => saveCaption(photo, e.target.value.trim())}
                />
                <div className="flex justify-between">
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => movePhoto(i, -1)}
                      className="w-7 h-7 rounded hover:bg-vinyl-line"
                      aria-label="Mover antes"
                    >
                      ←
                    </button>
                    <button
                      type="button"
                      onClick={() => movePhoto(i, 1)}
                      className="w-7 h-7 rounded hover:bg-vinyl-line"
                      aria-label="Mover después"
                    >
                      →
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => removePhoto(photo.id)}
                    className="w-7 h-7 rounded hover:bg-vinyl-line text-vinyl-accent"
                    aria-label="Borrar"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
