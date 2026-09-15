import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { daysUntil, isExpired } from "@/lib/subscription";
import EditorClient from "./EditorClient";

export default async function EditorPage({
  params,
}: {
  params: Promise<{ slug: string; token: string }>;
}) {
  const { slug, token } = await params;

  const page = await prisma.page.findUnique({
    where: { slug },
    include: { links: { orderBy: { order: "asc" } } },
  });

  if (!page || page.editToken !== token) {
    notFound();
  }

  const daysLeft = daysUntil(page.subscriptionExpiresAt);

  return (
    <EditorClient
      slug={page.slug}
      editToken={page.editToken}
      subscriptionExpiresAt={page.subscriptionExpiresAt.toISOString()}
      initialStatus={{
        isExpired: isExpired(page.subscriptionExpiresAt),
        daysLeft,
      }}
      initial={{
        artistName: page.artistName,
        albumTitle: page.albumTitle ?? "",
        bio: page.bio ?? "",
        coverImageUrl: page.coverImageUrl ?? "",
        themeColor: page.themeColor,
        contactEmail: page.contactEmail ?? "",
        links: page.links.map((l) => ({
          url: l.url,
          platform: l.platform,
          title: l.title,
          thumbnailUrl: l.thumbnailUrl,
        })),
      }}
    />
  );
}
