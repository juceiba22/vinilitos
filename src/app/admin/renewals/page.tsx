import { prisma } from "@/lib/prisma";
import AdminNav from "@/components/AdminNav";
import BatchCodesPanel, { type Batch } from "@/components/BatchCodesPanel";

// Lista tiradas en vivo — nunca cachear como estática ni consultar la base
// en build time.
export const dynamic = "force-dynamic";

export default async function AdminRenewalsPage() {
  const codes = await prisma.renewalCode.findMany({
    orderBy: { createdAt: "desc" },
  });

  const batches = new Map<string, Batch>();
  for (const c of codes) {
    const key = c.batchName ?? "Sin nombre";
    const existing = batches.get(key);
    if (existing) {
      existing.total += 1;
      if (c.used) existing.used += 1;
      if (c.createdAt > (existing.createdAt as Date)) existing.createdAt = c.createdAt;
    } else {
      batches.set(key, {
        batchName: key,
        total: 1,
        used: c.used ? 1 : 0,
        createdAt: c.createdAt,
      });
    }
  }

  const sortedBatches = [...batches.values()].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-12">
      <AdminNav current="/admin/renewals" />
      <h1 className="font-display text-3xl mb-6">Códigos de renovación</h1>
      <p className="text-vinyl-cream-dim text-sm mb-6">
        Generá estos códigos cuando un músico paga presencialmente la
        renovación anual. Los canjea él mismo desde su propio editor.
      </p>
      <BatchCodesPanel
        apiUrl="/api/admin/renewals"
        activateHint='Cada uno se canjea desde el editor del músico, en "Renovar +1 año".'
        batches={sortedBatches}
      />
    </main>
  );
}
