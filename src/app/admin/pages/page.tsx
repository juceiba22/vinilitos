import Link from "next/link";
import { prisma } from "@/lib/prisma";
import AdminNav from "@/components/AdminNav";
import { daysUntil, isExpired } from "@/lib/subscription";

// Muestra datos en vivo (vencimientos) — nunca debe quedar cacheada como
// página estática, ni intentar consultar la base en build time.
export const dynamic = "force-dynamic";

export default async function AdminPagesPage() {
  const pages = await prisma.page.findMany({
    orderBy: { subscriptionExpiresAt: "asc" },
  });

  return (
    <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-12">
      <AdminNav current="/admin/pages" />
      <h1 className="font-display text-3xl mb-6">Páginas</h1>
      <p className="text-vinyl-cream-dim text-sm mb-6">
        Todas las páginas activadas, ordenadas por vencimiento. El link
        &quot;editor&quot; es privado — úsalo solo para ayudar a un músico
        que perdió su link de edición.
      </p>
      {pages.length === 0 ? (
        <p className="text-vinyl-cream-dim text-sm">
          Todavía no se activó ninguna página.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-vinyl-cream-dim border-b border-vinyl-line">
                <th className="py-2 pr-4">Artista</th>
                <th className="py-2 pr-4">Mail</th>
                <th className="py-2 pr-4">Vence</th>
                <th className="py-2 pr-4">Estado</th>
                <th className="py-2">Links</th>
              </tr>
            </thead>
            <tbody>
              {pages.map((p) => {
                const expired = isExpired(p.subscriptionExpiresAt);
                const daysLeft = daysUntil(p.subscriptionExpiresAt);
                return (
                  <tr key={p.id} className="border-b border-vinyl-line/50">
                    <td className="py-2 pr-4">{p.artistName}</td>
                    <td className="py-2 pr-4">{p.contactEmail ?? "—"}</td>
                    <td className="py-2 pr-4">
                      {p.subscriptionExpiresAt.toLocaleDateString("es-AR")}
                    </td>
                    <td className="py-2 pr-4">
                      {expired ? (
                        <span className="text-vinyl-accent font-semibold">
                          Vencida
                        </span>
                      ) : daysLeft <= 30 ? (
                        <span className="text-vinyl-accent">
                          Vence en {daysLeft}d
                        </span>
                      ) : (
                        <span className="text-vinyl-cream-dim">Activa</span>
                      )}
                    </td>
                    <td className="py-2">
                      <div className="flex gap-3">
                        <Link
                          href={`/${p.slug}`}
                          target="_blank"
                          className="underline text-vinyl-cream-dim hover:text-vinyl-cream"
                        >
                          pública
                        </Link>
                        <Link
                          href={`/editor/${p.slug}/${p.editToken}`}
                          target="_blank"
                          className="underline text-vinyl-cream-dim hover:text-vinyl-cream"
                        >
                          editor
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
