import sharp from "sharp";

// Paleta derivada del arte de tapa. Las claves coinciden con las variables
// CSS de globals.css (--vinyl-*), así que alcanza con pisarlas en un
// contenedor para que todas las clases bg-vinyl-*, text-vinyl-*, etc. de
// adentro tomen los colores de la tapa.
export interface CoverPalette {
  black: string;
  blackSoft: string;
  cream: string;
  creamDim: string;
  accent: string;
  accentDim: string;
  line: string;
}

interface Hsl {
  h: number;
  s: number;
  l: number;
}

// Cache en memoria por URL: la tapa cambia muy poco y no queremos bajar y
// analizar la imagen en cada visita.
const cache = new Map<string, CoverPalette | null>();
const MAX_CACHE_ENTRIES = 500;

export async function getCoverPalette(
  imageUrl: string | null | undefined,
): Promise<CoverPalette | null> {
  if (!imageUrl) return null;
  if (cache.has(imageUrl)) return cache.get(imageUrl)!;

  let palette: CoverPalette | null = null;
  try {
    palette = await extractPalette(imageUrl);
  } catch {
    palette = null;
  }

  if (cache.size >= MAX_CACHE_ENTRIES) {
    cache.delete(cache.keys().next().value!);
  }
  cache.set(imageUrl, palette);
  return palette;
}

export function paletteToCssVars(p: CoverPalette): Record<string, string> {
  return {
    "--vinyl-black": p.black,
    "--vinyl-black-soft": p.blackSoft,
    "--vinyl-cream": p.cream,
    "--vinyl-cream-dim": p.creamDim,
    "--vinyl-accent": p.accent,
    "--vinyl-accent-dim": p.accentDim,
    "--vinyl-line": p.line,
  };
}

async function extractPalette(imageUrl: string): Promise<CoverPalette> {
  const res = await fetch(imageUrl, { signal: AbortSignal.timeout(5000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const input = Buffer.from(await res.arrayBuffer());

  const { data, info } = await sharp(input)
    .resize(48, 48, { fit: "cover" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  // Agrupamos los píxeles en cubetas de color (4 bits por canal) para
  // encontrar los colores predominantes.
  const buckets = new Map<number, { r: number; g: number; b: number; n: number }>();
  for (let i = 0; i < data.length; i += info.channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
    const bucket = buckets.get(key);
    if (bucket) {
      bucket.r += r;
      bucket.g += g;
      bucket.b += b;
      bucket.n++;
    } else {
      buckets.set(key, { r, g, b, n: 1 });
    }
  }

  const total = info.width * info.height;
  const colors = [...buckets.values()].map((c) => ({
    hsl: rgbToHsl(c.r / c.n, c.g / c.n, c.b / c.n),
    weight: c.n / total,
  }));

  // Color dominante: el más frecuente, con leve preferencia por los que
  // tienen algo de saturación (para que un fondo blanco/negro no mande).
  const dominant = maxBy(colors, (c) => c.weight * (0.4 + c.hsl.s)).hsl;

  // Color vibrante: el más saturado entre los que tienen presencia real en
  // la imagen y no son ni casi negros ni casi blancos.
  const candidates = colors.filter(
    (c) => c.weight > 0.004 && c.hsl.l > 0.2 && c.hsl.l < 0.85,
  );
  const vibrant = candidates.length
    ? maxBy(candidates, (c) => c.hsl.s * c.hsl.s * Math.sqrt(c.weight)).hsl
    : dominant;

  return buildPalette(dominant, vibrant);
}

function buildPalette(dominant: Hsl, vibrant: Hsl): CoverPalette {
  const baseHue = dominant.s > 0.12 ? dominant.h : vibrant.h;
  const baseSat = clamp(Math.max(dominant.s, vibrant.s * 0.6), 0, 0.55);

  // Tapa en escala de grises: el acento queda neutro en vez de inventar un
  // color que no está en la imagen.
  const grayscale = vibrant.s < 0.15;
  const accentSat = grayscale ? 0.08 : clamp(vibrant.s, 0.55, 0.9);

  return {
    black: hsl(baseHue, baseSat, 0.08),
    blackSoft: hsl(baseHue, baseSat * 0.9, 0.13),
    line: hsl(baseHue, baseSat * 0.6, 0.26),
    cream: hsl(baseHue, Math.min(baseSat, 0.4), 0.94),
    creamDim: hsl(baseHue, Math.min(baseSat, 0.25), 0.76),
    accent: hsl(vibrant.h, accentSat, grayscale ? 0.8 : 0.64),
    accentDim: hsl(vibrant.h, accentSat * 0.9, grayscale ? 0.55 : 0.44),
  };
}

function rgbToHsl(r: number, g: number, b: number): Hsl {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return { h: h * 60, s, l };
}

function hsl(h: number, s: number, l: number): string {
  return `hsl(${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%)`;
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function maxBy<T>(items: T[], score: (item: T) => number): T {
  let best = items[0];
  let bestScore = score(best);
  for (const item of items.slice(1)) {
    const s = score(item);
    if (s > bestScore) {
      best = item;
      bestScore = s;
    }
  }
  return best;
}
