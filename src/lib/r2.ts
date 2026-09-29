import { AwsClient } from "aws4fetch";

// Cliente para Cloudflare R2 a través de su API compatible con S3. Las fotos
// se suben directo desde el navegador con una URL firmada (así no pasan por
// el server ni chocan con el límite de tamaño de body de Vercel), y el server
// solo firma, registra y borra.

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

export const MAX_PHOTO_BYTES = 10 * 1024 * 1024; // 10 MB
const UPLOAD_URL_TTL_SECONDS = 10 * 60;

interface R2Config {
  client: AwsClient;
  endpoint: string;
  publicUrl: string;
}

function getConfig(): R2Config | null {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET;
  const publicUrl = process.env.R2_PUBLIC_URL;
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket || !publicUrl) {
    return null;
  }
  return {
    client: new AwsClient({
      accessKeyId,
      secretAccessKey,
      service: "s3",
      region: "auto",
    }),
    endpoint: `https://${accountId}.r2.cloudflarestorage.com/${bucket}`,
    publicUrl: publicUrl.replace(/\/+$/, ""),
  };
}

export function isR2Configured(): boolean {
  return getConfig() !== null;
}

export function extensionForType(contentType: string): string | null {
  return ALLOWED_TYPES[contentType] ?? null;
}

export function publicUrlForKey(key: string): string {
  const config = getConfig();
  if (!config) throw new Error("R2 no está configurado.");
  return `${config.publicUrl}/${key}`;
}

export async function createUploadUrl(
  key: string,
  contentType: string,
): Promise<string> {
  const config = getConfig();
  if (!config) throw new Error("R2 no está configurado.");
  const url = new URL(`${config.endpoint}/${key}`);
  url.searchParams.set("X-Amz-Expires", String(UPLOAD_URL_TTL_SECONDS));
  const signed = await config.client.sign(url.toString(), {
    method: "PUT",
    headers: { "Content-Type": contentType },
    aws: { signQuery: true },
  });
  return signed.url;
}

export async function headObject(
  key: string,
): Promise<{ size: number; contentType: string } | null> {
  const config = getConfig();
  if (!config) throw new Error("R2 no está configurado.");
  const res = await config.client.fetch(`${config.endpoint}/${key}`, {
    method: "HEAD",
  });
  if (!res.ok) return null;
  return {
    size: Number(res.headers.get("content-length") ?? 0),
    contentType: res.headers.get("content-type") ?? "",
  };
}

export async function deleteObject(key: string): Promise<void> {
  const config = getConfig();
  if (!config) throw new Error("R2 no está configurado.");
  const res = await config.client.fetch(`${config.endpoint}/${key}`, {
    method: "DELETE",
  });
  if (!res.ok && res.status !== 404) {
    throw new Error(`R2 DELETE falló: HTTP ${res.status}`);
  }
}
