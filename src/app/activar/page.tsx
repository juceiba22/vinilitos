import { Suspense } from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ActivationForm from "./ActivationForm";

export const dynamic = "force-dynamic";

export default async function ActivarPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await searchParams;

  if (code) {
    const activation = await prisma.activationCode.findUnique({
      where: { code: code.trim().toUpperCase() },
    });
    // Varios vinilitos físicos son el mismo álbum (mismo batchName): si ese
    // álbum ya tiene página, no tiene sentido mostrar el formulario de
    // activación de nuevo — se manda directo a la página pública.
    if (activation?.batchName) {
      const existingPage = await prisma.page.findUnique({
        where: { activationBatchName: activation.batchName },
        select: { slug: true },
      });
      if (existingPage) {
        redirect(`/${existingPage.slug}`);
      }
    }
  }

  return (
    <main className="flex-1 flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <p className="uppercase tracking-[0.3em] text-vinyl-accent text-xs mb-3 text-center">
          Vinilitos
        </p>
        <h1 className="font-display text-3xl mb-2 text-center">
          Activá tu vinilito
        </h1>
        <p className="text-vinyl-cream-dim text-sm mb-8 text-center">
          Ingresá el código que viene con tu vinilito (o que escaneaste por
          NFC/QR) para crear tu página.
        </p>
        <Suspense fallback={null}>
          <ActivationForm />
        </Suspense>
      </div>
    </main>
  );
}
