import * as cheerio from "cheerio";

export type Platform =
  | "spotify"
  | "youtube"
  | "soundcloud"
  | "appleMusic"
  | "bandcamp"
  | "other";

export interface LinkPreview {
  platform: Platform;
  title: string | null;
  thumbnailUrl: string | null;
}

export function detectPlatform(rawUrl: string): Platform {
  let host = "";
  try {
    host = new URL(rawUrl).hostname.replace(/^www\./, "");
  } catch {
    return "other";
  }
  if (host.includes("spotify.com")) return "spotify";
  if (host.includes("youtube.com") || host.includes("youtu.be")) return "youtube";
  if (host.includes("soundcloud.com")) return "soundcloud";
  if (host.includes("music.apple.com")) return "appleMusic";
  if (host.includes("bandcamp.com")) return "bandcamp";
  return "other";
}

const OEMBED_ENDPOINTS: Partial<Record<Platform, (url: string) => string>> = {
  spotify: (url) => `https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`,
  youtube: (url) => `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`,
  soundcloud: (url) => `https://soundcloud.com/oembed?url=${encodeURIComponent(url)}&format=json`,
};

async function fetchOEmbed(url: string, platform: Platform): Promise<LinkPreview | null> {
  const buildEndpoint = OEMBED_ENDPOINTS[platform];
  if (!buildEndpoint) return null;
  try {
    const res = await fetch(buildEndpoint(url), {
      headers: { "User-Agent": "Mozilla/5.0 (Vinilitos link preview bot)" },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { title?: string; thumbnail_url?: string };
    return {
      platform,
      title: data.title ?? null,
      thumbnailUrl: data.thumbnail_url ?? null,
    };
  } catch {
    return null;
  }
}

// Fallback genérico: scrapea las meta tags Open Graph de cualquier página
// (Apple Music, Bandcamp, o cualquier otra plataforma que no tenga oEmbed público).
async function fetchOpenGraph(url: string, platform: Platform): Promise<LinkPreview | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (Vinilitos link preview bot)" },
    });
    if (!res.ok) return null;
    const html = await res.text();
    const $ = cheerio.load(html);
    const title =
      $('meta[property="og:title"]').attr("content") ??
      $("title").first().text() ??
      null;
    const thumbnailUrl = $('meta[property="og:image"]').attr("content") ?? null;
    return { platform, title, thumbnailUrl };
  } catch {
    return null;
  }
}

export async function fetchLinkPreview(rawUrl: string): Promise<LinkPreview> {
  const platform = detectPlatform(rawUrl);

  const viaOEmbed = await fetchOEmbed(rawUrl, platform);
  if (viaOEmbed && (viaOEmbed.title || viaOEmbed.thumbnailUrl)) return viaOEmbed;

  const viaOg = await fetchOpenGraph(rawUrl, platform);
  if (viaOg) return viaOg;

  return { platform, title: null, thumbnailUrl: null };
}
