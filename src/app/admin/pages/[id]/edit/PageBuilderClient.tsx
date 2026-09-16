"use client";

import { useState } from "react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import VinylDisc from "@/components/VinylDisc";
import QrCodeGrid from "@/components/QrCodeGrid";
import { buildTrackUrl } from "@/lib/codeUrl";

interface LinkCodeItem {
  code: string;
  nfcWritten: boolean;
}

interface LinkItem {
  id: string;
  url: string;
  platform: string;
  title: string | null;
  thumbnailUrl: string | null;
  code: LinkCodeItem | null;
}

interface PageFields {
  artistName: string;
  albumTitle: string;
  bio: string;
  coverImageUrl: string;
  themeColor: string;
  contactEmail: string;
  links: LinkItem[];
}

const PLATFORM_LABEL: Record<string, string> = {
  spotify: "Spotify",
  youtube: "YouTube",
  soundcloud: "SoundCloud",
  appleMusic: "Apple Music",
  bandcamp: "Bandcamp",
  other: "Enlace",
};

const THEME_PRESETS = ["#1a1310", "#0f1f1c", "#1c1430", "#2a1418", "#14202b"];

export default function PageBuilderClient({
  pageId,
  published: initialPublished,
  editToken: initialEditToken,
  slug,
  initial,
}: {
  pageId: string;
  published: boolean;
  editToken: string | null;
  slug: string;
  initial: PageFields;
}) {
  const [data, setData] = useState<PageFields>(initial);
  const [newUrl, setNewUrl] = useState("");
  const [addingLink, setAddingLink] = useState(false);
  const [savingFields, setSavingFields] = useState(false);
  const [generatingCode, setGeneratingCode] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [published, setPublished] = useState(initialPublished);
  const [editToken, setEditToken] = useState(initialEditToken);

  async function handleSaveFields() {
    setSavingFields(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/pages/${pageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          artistName: data.artistName,
          albumTitle: data.albumTitle,
          bio: data.bio,
          coverImageUrl: data.coverImageUrl,
          themeColor: data.themeColor,
          contactEmail: data.contactEmail,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "No se pudo guardar.");
        return;
      }
      setMessage("Datos guardados.");
    } catch {
      setError("Error de red al guardar.");
    } finally {
      setSavingFields(false);
    }
  }

  async function handleAddLink(e: React.FormEvent) {
    e.preventDefault();
    if (!newUrl.trim()) return;
    setAddingLink(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/pages/${pageId}/links`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: newUrl.trim() }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "No se pudo leer ese link.");
        return;
      }
      const link: LinkItem = { ...json.link, code: null };
      setData((d) => ({
        ...d,
        links: [...d.links, link],
        coverImageUrl: d.coverImageUrl || link.thumbnailUrl || d.coverImageUrl,
      }));
      setNewUrl("");
    } catch {
      setError("Error de red al buscar la portada del link.");
    } finally {
      setAddingLink(false);
    }
  }

  async function removeLink(linkId: string) {
    setError(null);
    try {
      const res = await fetch(`/api/admin/pages/${pageId}/links/${linkId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        setError(json?.error ?? "No se pudo quitar el link.");
        return;
      }
      setData((d) => ({ ...d, links: d.links.filter((l) => l.id !== linkId) }));
    } catch {
      setError("Error de red.");
    }
  }

  async function moveLink(index: number, dir: -1 | 1) {
    const links = [...data.links];
    const target = index + dir;
    if (target < 0 || target >= links.length) return;
    [links[index], links[target]] = [links[target], links[index]];
    setData((d) => ({ ...d, links }));
    try {
      await fetch(`/api/admin/pages/${pageId}/links/reorder`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedLinkIds: links.map((l) => l.id) }),
      });
    } catch {
      setError("Error de red al reordenar.");
    }
  }

  async function generateCode(linkId: string) {
    setGeneratingCode(linkId);
    setError(null);
    try {
      const res = await fetch(`/api/admin/pages/${pageId}/links/${linkId}/code`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "No se pudo generar el código.");
        return;
      }
      setData((d) => ({
        ...d,
        links: d.links.map((l) =>
          l.id === linkId
            ? { ...l, code: { code: json.code.code, nfcWritten: json.code.nfcWritten } }
            : l
        ),
      }));
    } catch {
      setError("Error de red al generar el código.");
    } finally {
      setGeneratingCode(null);
    }
  }

  async function toggleNfcWritten(linkId: string, nfcWritten: boolean) {
    setError(null);
    try {
      const res = await fetch(`/api/admin/pages/${pageId}/links/${linkId}/code`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nfcWritten }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "No se pudo actualizar.");
        return;
      }
      setData((d) => ({
        ...d,
        links: d.links.map((l) =>
          l.id === linkId ? { ...l, code: { code: l.code!.code, nfcWritten } } : l
        ),
      }));
    } catch {
      setError("Error de red.");
    }
  }

  async function handlePublish() {
    setPublishing(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/pages/${pageId}/publish`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "No se pudo publicar.");
        return;
      }
      setPublished(true);
      setEditToken(json.editToken);
      setMessage("¡Página publicada!");
    } catch {
      setError("Error de red al publicar.");
    } finally {
      setPublishing(false);
    }
  }

  const editUrl = editToken ? `/editor/${slug}/${editToken}` : null;

  return (
    <div>
      <p className="uppercase tracking-[0.3em] text-vinyl-accent text-xs mb-2">
        {published ? "Página publicada" : "Armando página"}
      </p>
      <h1 className="font-display text-3xl mb-6">{data.artistName}</h1>

      <div className="flex justify-center mb-8">
        <VinylDisc
          label={data.albumTitle || data.artistName}
          coverImageUrl={data.coverImageUrl || undefined}
          spinning={false}
          size={180}
        />
      </div>

      <section className="grid gap-4 mb-10">
        <Field label="Nombre de artista">
          <input
            className="input"
            value={data.artistName}
            onChange={(e) => setData((d) => ({ ...d, artistName: e.target.value }))}
          />
        </Field>
        <Field label="Álbum / canción (opcional)">
          <input
            className="input"
            value={data.albumTitle}
            onChange={(e) => setData((d) => ({ ...d, albumTitle: e.target.value }))}
          />
        </Field>
        <Field label="Bio corta (opcional)">
          <textarea
            className="input min-h-20 resize-y"
            value={data.bio}
            onChange={(e) => setData((d) => ({ ...d, bio: e.target.value }))}
          />
        </Field>
        <Field label="Mail de contacto del artista (opcional, para avisos de vencimiento)">
          <input
            type="email"
            className="input"
            value={data.contactEmail}
            onChange={(e) => setData((d) => ({ ...d, contactEmail: e.target.value }))}
          />
        </Field>
        <Field label="Color de fondo">
          <div className="flex gap-2">
            {THEME_PRESETS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setData((d) => ({ ...d, themeColor: c }))}
                className={`w-8 h-8 rounded-full border-2 ${
                  data.themeColor === c ? "border-vinyl-accent" : "border-transparent"
                }`}
                style={{ background: c }}
                aria-label={c}
              />
            ))}
          </div>
        </Field>
        <button
          type="button"
          onClick={handleSaveFields}
          disabled={savingFields}
          className="self-start border border-vinyl-line hover:border-vinyl-accent disabled:opacity-60 transition-colors rounded-lg px-4 py-2 text-sm"
        >
          {savingFields ? "Guardando..." : "Guardar datos"}
        </button>
      </section>

      <section className="mb-10">
        <h2 className="font-display text-xl mb-3">Links encargados</h2>
        <form onSubmit={handleAddLink} className="flex gap-2 mb-4">
          <input
            className="input flex-1"
            placeholder="Pegá un link de Spotify, YouTube, etc."
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
          />
          <button
            type="submit"
            disabled={addingLink}
            className="bg-vinyl-accent hover:bg-vinyl-accent-dim disabled:opacity-60 transition-colors text-vinyl-black font-semibold rounded-lg px-4 whitespace-nowrap"
          >
            {addingLink ? "Buscando..." : "Agregar"}
          </button>
        </form>

        <ul className="flex flex-col gap-3">
          {data.links.map((link, i) => (
            <li
              key={link.id}
              className="bg-vinyl-black-soft border border-vinyl-line rounded-lg p-3"
            >
              <div className="flex items-center gap-3">
                {link.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={link.thumbnailUrl}
                    alt=""
                    className="w-12 h-12 rounded object-cover shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded bg-vinyl-line shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-vinyl-accent uppercase tracking-wide">
                    {PLATFORM_LABEL[link.platform] ?? link.platform}
                  </p>
                  <p className="truncate text-sm">{link.title || link.url}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => moveLink(i, -1)}
                    className="w-7 h-7 rounded hover:bg-vinyl-line"
                    aria-label="Subir"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => moveLink(i, 1)}
                    className="w-7 h-7 rounded hover:bg-vinyl-line"
                    aria-label="Bajar"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => removeLink(link.id)}
                    className="w-7 h-7 rounded hover:bg-vinyl-line text-vinyl-accent"
                    aria-label="Quitar"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-vinyl-line/50">
                {link.code ? (
                  <div className="flex items-center gap-4">
                    <div className="bg-white rounded-lg p-2 shrink-0">
                      <QRCodeSVG value={buildTrackUrl(link.code.code)} size={72} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-sm">{link.code.code}</p>
                      <label className="flex items-center gap-2 text-xs text-vinyl-cream-dim mt-1">
                        <input
                          type="checkbox"
                          checked={link.code.nfcWritten}
                          onChange={(e) => toggleNfcWritten(link.id, e.target.checked)}
                        />
                        Grabado en NFC
                      </label>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => generateCode(link.id)}
                    disabled={generatingCode === link.id}
                    className="border border-vinyl-line hover:border-vinyl-accent disabled:opacity-60 transition-colors rounded-lg px-4 py-2 text-sm"
                  >
                    {generatingCode === link.id ? "Generando..." : "Generar código (QR + NFC)"}
                  </button>
                )}
              </div>
            </li>
          ))}
          {data.links.length === 0 && (
            <p className="text-vinyl-cream-dim text-sm">
              Todavía no cargaste ningún link.
            </p>
          )}
        </ul>
      </section>

      {(() => {
        const generatedCodes = data.links
          .filter((l): l is LinkItem & { code: LinkCodeItem } => !!l.code)
          .map((l) => l.code.code);
        if (generatedCodes.length === 0) return null;
        return (
          <section className="mb-10 print:hidden">
            <h2 className="font-display text-xl mb-3">Imprimir códigos</h2>
            <div className="bg-vinyl-black-soft border border-vinyl-line rounded-xl p-4 print:bg-white print:border-0 print:p-0">
              <QrCodeGrid codes={generatedCodes} title={data.artistName} />
            </div>
          </section>
        );
      })()}

      {error && <p className="text-vinyl-accent text-sm mb-4">{error}</p>}
      {message && <p className="text-sm mb-4">{message}</p>}

      {published && editUrl ? (
        <div className="bg-vinyl-black-soft border border-vinyl-accent rounded-xl p-4 mb-6">
          <p className="text-xs uppercase tracking-wide text-vinyl-accent mb-2">
            Código de edición del artista
          </p>
          <p className="text-vinyl-cream-dim text-sm mb-2">
            Pasale este link privado al artista para que pueda sumar
            miembros, fotos e info extra a su página más adelante.
          </p>
          <code className="block bg-vinyl-black rounded-lg px-3 py-2 text-xs break-all mb-3">
            {editUrl}
          </code>
          <div className="flex gap-3">
            <Link href={`/${slug}`} target="_blank" className="underline text-vinyl-cream-dim hover:text-vinyl-cream text-sm">
              Ver página pública →
            </Link>
            <Link href={editUrl} target="_blank" className="underline text-vinyl-accent text-sm">
              Abrir editor del artista →
            </Link>
          </div>
        </div>
      ) : (
        <button
          onClick={handlePublish}
          disabled={publishing}
          className="bg-vinyl-accent hover:bg-vinyl-accent-dim disabled:opacity-60 transition-colors text-vinyl-black font-semibold rounded-full px-8 py-3"
        >
          {publishing ? "Publicando..." : "Publicar página"}
        </button>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-wide text-vinyl-cream-dim block mb-1">
        {label}
      </span>
      {children}
    </label>
  );
}
