import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AdminNav from "@/components/AdminNav";
import PageBuilderClient from "./PageBuilderClient";

export const dynamic = "force-dynamic";

export default async function AdminPageBuilderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const page = await prisma.page.findUnique({
    where: { id },
    include: { links: { orderBy: { order: "asc" }, include: { code: true } } },
  });

  if (!page) {
    notFound();
  }

  return (
    <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-12">
      <AdminNav current="/admin/pages" />
      <PageBuilderClient
        pageId={page.id}
        published={page.published}
        editToken={page.editToken}
        slug={page.slug}
        initial={{
          artistName: page.artistName,
          albumTitle: page.albumTitle ?? "",
          bio: page.bio ?? "",
          coverImageUrl: page.coverImageUrl ?? "",
          themeColor: page.themeColor,
          contactEmail: page.contactEmail ?? "",
          links: page.links.map((l) => ({
            id: l.id,
            url: l.url,
            platform: l.platform,
            title: l.title,
            thumbnailUrl: l.thumbnailUrl,
            code: l.code ? { code: l.code.code, nfcWritten: l.code.nfcWritten } : null,
          })),
        }}
      />
    </main>
  );
}
