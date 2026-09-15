import Link from "next/link";
import AdminNav from "@/components/AdminNav";
import NfcStepper from "./NfcStepper";

export const dynamic = "force-dynamic";

export default async function AdminNfcPage({
  searchParams,
}: {
  searchParams: Promise<{ batch?: string }>;
}) {
  const { batch } = await searchParams;

  return (
    <main className="flex-1 max-w-lg mx-auto w-full px-6 py-12">
      <AdminNav current="/admin/codes" />
      {batch ? (
        <NfcStepper batchName={batch} />
      ) : (
        <p className="text-vinyl-cream-dim text-sm">
          Falta indicar la tirada. Volvé a{" "}
          <Link href="/admin/codes" className="underline text-vinyl-accent">
            Códigos de activación
          </Link>{" "}
          y usá &quot;Grabar NFC&quot; en la tirada que corresponda.
        </p>
      )}
    </main>
  );
}
