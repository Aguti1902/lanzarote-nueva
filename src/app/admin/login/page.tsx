"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Contraseña incorrecta");
        return;
      }
      // Limpiar flag legacy inseguro
      try {
        localStorage.removeItem("lt_admin");
      } catch {
        /* ignore */
      }
      router.replace("/admin");
      router.refresh();
    } catch {
      setError("No se pudo conectar con el servidor");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-bg-deep via-[#1a4d73] to-ocean px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl ring-1 ring-sand-line"
      >
        <p className="font-display text-2xl text-ink">Administración</p>
        <p className="mt-1 text-sm text-ink-muted">Lanzarote Experience Tours</p>
        <label className="mt-6 block">
          <span className="mb-1 block text-sm font-medium">Contraseña</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-sand-line px-3 py-2.5 text-sm outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/20"
            placeholder="••••••••"
            autoFocus
            autoComplete="current-password"
            disabled={loading}
          />
        </label>
        {error && <p className="mt-2 text-sm text-coral">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="mt-5 w-full rounded-md bg-ocean py-2.5 font-semibold text-white hover:bg-ocean-deep disabled:opacity-60"
        >
          {loading ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </div>
  );
}
