import { Suspense } from "react";
import LoginForm from "./LoginForm";

export default function AdminLoginPage() {
  return (
    <main className="flex-1 flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <p className="uppercase tracking-[0.3em] text-vinyl-accent text-xs mb-3 text-center">
          Vinilitos admin
        </p>
        <h1 className="font-display text-3xl mb-6 text-center">Ingresar</h1>
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
