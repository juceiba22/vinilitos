// Sesión de admin firmada con la propia ADMIN_PASSWORD como clave HMAC (Web
// Crypto, para que funcione igual en middleware/Edge y en route handlers).
// Si la contraseña cambia, todas las sesiones firmadas con la anterior
// quedan inválidas automáticamente.

export const ADMIN_SESSION_COOKIE = "vinilitos_admin_session";
const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 horas

const encoder = new TextEncoder();

function getSecret(): string {
  const secret = process.env.ADMIN_PASSWORD;
  if (!secret) throw new Error("Falta ADMIN_PASSWORD en las variables de entorno.");
  return secret;
}

function getKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

function toBase64Url(bytes: ArrayBuffer): string {
  let str = "";
  for (const byte of new Uint8Array(bytes)) str += String.fromCharCode(byte);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string): Uint8Array {
  const b64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
  const str = atob(padded);
  const bytes = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) bytes[i] = str.charCodeAt(i);
  return bytes;
}

export async function createAdminSessionToken(): Promise<string> {
  const payload = String(Date.now() + SESSION_TTL_MS);
  const key = await getKey(getSecret());
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return `${payload}.${toBase64Url(signature)}`;
}

export async function verifyAdminSessionToken(
  token: string | undefined
): Promise<boolean> {
  if (!token) return false;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;

  const exp = Number(payload);
  if (!Number.isFinite(exp) || exp < Date.now()) return false;

  try {
    const key = await getKey(getSecret());
    return await crypto.subtle.verify(
      "HMAC",
      key,
      fromBase64Url(signature) as BufferSource,
      encoder.encode(payload)
    );
  } catch {
    return false;
  }
}

// Comparación en tiempo constante para no filtrar la contraseña por timing.
export function timingSafeEqualString(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
