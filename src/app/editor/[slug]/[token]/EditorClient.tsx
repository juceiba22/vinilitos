"use client";

import { useState } from "react";
import Link from "next/link";
import VinylDisc from "@/components/VinylDisc";

interface LinkItem {
  url: string;
  platform: string;
  title: string | null;
  thumbnailUrl: string | null;
}

interface EditorData {
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

interface SubscriptionStatus {
  isExpired: boolean;
  daysLeft: number;
}

export default function EditorClient({
  slug,
  editToken,
  initial,
  subscriptionExpiresAt,
  initialStatus,
}: {
  slug: string;
  editToken: string;
  initial: EditorData;
  subscriptionExpiresAt: string;
  initialStatus: SubscriptionStatus;
}) {
  const [data, setData] = useState<EditorData>(initial);
  const [newUrl, setNewUrl] = useState("");
  const [fetchingPreview, setFetchingPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [expiresAt, setExpiresAt] = useState(subscriptionExpiresAt);
  const [renewalCode, setRenewalCode] = useState("");
  const [renewing, setRenewing] = useState(false);
  const [renewMessage, setRenewMessage] = useState<string | null>(null);
  const [renewError, setRenewError] = useState<string | null>(null);

  const expiresAtDate = new Date(expiresAt);
  // isExpired/daysLeft depend on Date.now(), which is impure and can't be
  // called during render. The initial value is computed server-side
  // (see page.tsx) and recomputed here only inside the renew event handler.
  const [status, setStatus] = useState<SubscriptionStatus>(initialStatus);

  async function handleRenew(e: React.FormEvent) {
    e.preventDefault();
    if (!renewalCode.trim()) return;
    setRenewing(true);
    setRenewMessage(null);
    setRenewError(null);
    try {
      const res = await fetch("/api/renewal/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: renewalCode.trim(), slug, editToken }),
      });
      const json = await res.json();
      if (!res.ok) {
        setRenewError(json.error ?? "No se pudo renovar.");
        return;
      }
      const newExpiresAt: string = json.subscriptionExpiresAt;
      const target = new Date(newExpiresAt).getTime();
      const now = Date.now();
      setExpiresAt(newExpiresAt);
      setStatus({
        isExpired: target < now,
        daysLeft: Math.ceil((target - now) / (1000 * 60 * 60 * 24)),
      });
      setRenewalCode("");
      setRenewMessage("¡Renovado! Tu página sigue activa un año más.");
    } catch {
      setRenewError("Error de red al renovar.");
    } finally {
      setRenewing(false);
    }
  }

  async function handleAddLink(e: React.FormEvent) {
    e.preventDefault();
    if (!newUrl.trim()) return;
    setFetchingPreview(true);
    setError(null);
    try {
      const res = await fetch("/api/links/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: newUrl.trim() }),
      });
      const preview = await res.json();
      if (!res.ok) {
        setError(preview.error ?? "No se pudo leer ese link.");
        setFetchingPreview(false);
        return;
      }
      const newLink: LinkItem = {
        url: newUrl.trim(),
        platform: preview.platform,
        title: preview.title,
        thumbnailUrl: preview.thumbnailUrl,
      };
      setData((d) => ({
        ...d,
        links: [...d.links, newLink],
        coverImageUrl:
          d.coverImageUrl || preview.thumbnailUrl || d.coverImageUrl,
      }));
      setNewUrl("");
    } catch {
      setError("Error de red al buscar la portada del link.");
    } finally {
      setFetchingPreview(false);
    }
  }

  function removeLink(index: number) {
    setData((d) => ({ ...d, links: d.links.filter((_, i) => i !== index) }));
  }

  function moveLink(index: number, dir: -1 | 1) {
    setData((d) => {
      const links = [...d.links];
      const target = index + dir;
      if (target < 0 || target >= links.length) return d;
      [links[index], links[target]] = [links[target], links[index]];
      return { ...d, links };
    });
  }

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch(`/api/pages/${slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, editToken }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "No se pudo guardar.");
        return;
      }
      setMessage("Guardado. Tu página ya está actualizada.");
    } catch {
      setError("Error de red al guardar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-12">
      <p className="uppercase tracking-[0.3em] text-vinyl-accent text-xs mb-2">
        Editor de tu página
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

      <section className="mb-10 bg-vinyl-black-soft border border-vinyl-line rounded-xl p-4">
        {status.isExpired ? (
          <p className="text-vinyl-accent text-sm font-semibold mb-3">
            Suscripción vencida el{" "}
            {expiresAtDate.toLocaleDateString("es-AR")}. Tu página pública
            está oculta hasta que renueves.
          </p>
        ) : (
          <p className="text-sm mb-3">
            Suscripción activa hasta el{" "}
            <strong>{expiresAtDate.toLocaleDateString("es-AR")}</strong>
            {status.daysLeft <= 30 && (
              <span className="text-vinyl-accent">
                {" "}
                (vence en {status.daysLeft} días)
              </span>
            )}
            .
          </p>
        )}
        <label className="block mb-3">
          <span className="text-xs uppercase tracking-wide text-vinyl-cream-dim block mb-1">
            Mail para avisos de vencimiento
          </span>
          <input
            type="email"
            className="input"
            placeholder="tu@mail.com"
            value={data.contactEmail}
            onChange={(e) =>
              setData((d) => ({ ...d, contactEmail: e.target.value }))
            }
          />
        </label>
        <form onSubmit={handleRenew} className="flex gap-2">
          <input
            className="input flex-1"
            placeholder="Código de renovación"
            value={renewalCode}
            onChange={(e) => setRenewalCode(e.target.value)}
          />
          <button
            type="submit"
            disabled={renewing}
            className="bg-vinyl-accent hover:bg-vinyl-accent-dim disabled:opacity-60 transition-colors text-vinyl-black font-semibold rounded-lg px-4 whitespace-nowrap"
          >
            {renewing ? "Renovando..." : "Renovar +1 año"}
          </button>
        </form>
        {renewError && (
          <p className="text-vinyl-accent text-sm mt-2">{renewError}</p>
        )}
        {renewMessage && (
          <p className="text-sm mt-2">{renewMessage}</p>
        )}
      </section>

      <section className="grid gap-4 mb-10">
        <Field label="Nombre de artista">
          <input
            className="input"
            value={data.artistName}
            onChange={(e) =>
              setData((d) => ({ ...d, artistName: e.target.value }))
            }
          />
        </Field>
        <Field label="Álbum / canción (opcional)">
          <input
            className="input"
            value={data.albumTitle}
            onChange={(e) =>
              setData((d) => ({ ...d, albumTitle: e.target.value }))
            }
          />
        </Field>
        <Field label="Bio corta (opcional)">
          <textarea
            className="input min-h-20 resize-y"
            value={data.bio}
            onChange={(e) => setData((d) => ({ ...d, bio: e.target.value }))}
          />
        </Field>
        <Field label="URL de portada (opcional, se completa sola con el primer link)">
          <input
            className="input"
            value={data.coverImageUrl}
            onChange={(e) =>
              setData((d) => ({ ...d, coverImageUrl: e.target.value }))
            }
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
                  data.themeColor === c
                    ? "border-vinyl-accent"
                    : "border-transparent"
                }`}
                style={{ background: c }}
                aria-label={c}
              />
            ))}
          </div>
        </Field>
      </section>

      <section className="mb-10">
        <h2 className="font-display text-xl mb-3">Tus links</h2>
        <form onSubmit={handleAddLink} className="flex gap-2 mb-4">
          <input
            className="input flex-1"
            placeholder="Pegá un link de Spotify, YouTube, etc."
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
          />
          <button
            type="submit"
            disabled={fetchingPreview}
            className="bg-vinyl-accent hover:bg-vinyl-accent-dim disabled:opacity-60 transition-colors text-vinyl-black font-semibold rounded-lg px-4 whitespace-nowrap"
          >
            {fetchingPreview ? "Buscando..." : "Agregar"}
          </button>
        </form>

        <ul className="flex flex-col gap-2">
          {data.links.map((link, i) => (
            <li
              key={`${link.url}-${i}`}
              className="flex items-center gap-3 bg-vinyl-black-soft border border-vinyl-line rounded-lg p-3"
            >
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
                  onClick={() => removeLink(i)}
                  className="w-7 h-7 rounded hover:bg-vinyl-line text-vinyl-accent"
                  aria-label="Quitar"
                >
                  ✕
                </button>
              </div>
            </li>
          ))}
          {data.links.length === 0 && (
            <p className="text-vinyl-cream-dim text-sm">
              Todavía no agregaste ningún link.
            </p>
          )}
        </ul>
      </section>

      {error && <p className="text-vinyl-accent text-sm mb-4">{error}</p>}
      {message && (
        <p className="text-sm mb-4">
          {message}{" "}
          <Link href={`/${slug}`} className="underline text-vinyl-accent">
            Ver mi página →
          </Link>
        </p>
      )}

      <button
        onClick={handleSave}
        disabled={saving}
        className="bg-vinyl-accent hover:bg-vinyl-accent-dim disabled:opacity-60 transition-colors text-vinyl-black font-semibold rounded-full px-8 py-3"
      >
        {saving ? "Guardando..." : "Guardar cambios"}
      </button>

      <style jsx global>{`
        .input {
          width: 100%;
          background: var(--vinyl-black);
          border: 1px solid var(--vinyl-line);
          border-radius: 0.5rem;
          padding: 0.65rem 1rem;
          outline: none;
          color: var(--vinyl-cream);
        }
        .input:focus {
          border-color: var(--vinyl-accent);
        }
      `}</style>
    </main>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-wide text-vinyl-cream-dim block mb-1">
        {label}
      </span>
      {children}
    </label>
  );
}
