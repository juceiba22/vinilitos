import { Suspense } from "react";
import ActivationForm from "./ActivationForm";

export default function ActivarPage() {
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
