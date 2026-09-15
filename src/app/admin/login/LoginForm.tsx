"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo ingresar.");
        setLoading(false);
        return;
      }
      router.push(searchParams.get("next") || "/admin/codes");
      router.refresh();
    } catch {
      setError("Error de red.");
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-vinyl-black-soft border border-vinyl-line rounded-2xl p-6 flex flex-col gap-4"
    >
      <div>
        <label className="text-xs uppercase tracking-wide text-vinyl-cream-dim block mb-1">
          Contraseña
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoFocus
          className="input"
        />
      </div>
      {error && <p className="text-vinyl-accent text-sm text-center">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="bg-vinyl-accent hover:bg-vinyl-accent-dim disabled:opacity-60 transition-colors text-vinyl-black font-semibold rounded-full px-6 py-3 mt-2"
      >
        {loading ? "Ingresando..." : "Ingresar"}
      </button>
    </form>
  );
}
