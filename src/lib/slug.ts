import { prisma } from "@/lib/prisma";

export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function uniquePageSlug(base: string): Promise<string> {
  const cleanBase = slugify(base) || "artista";
  let candidate = cleanBase;
  let attempt = 0;
  while (await prisma.page.findUnique({ where: { slug: candidate } })) {
    attempt += 1;
    candidate = `${cleanBase}-${attempt + 1}`;
  }
  return candidate;
}
