"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password === "admin123") {
      localStorage.setItem("lt_admin", "1");
      router.push("/admin");
    } else {
      setError("Contraseña incorrecta");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-bg-deep via-[#1a4d73] to-ocean px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl ring-1 ring-sand-line"
      >
        <p className="font-display text-2xl text-ink">Administración</p>
        <p className="mt-1 text-sm text-ink-muted">Lanzarote Travels</p>
        <label className="mt-6 block">
          <span className="mb-1 block text-sm font-medium">Contraseña</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-sand-line px-3 py-2.5 text-sm outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/20"
            placeholder="••••••••"
            autoFocus
          />
        </label>
        {error && <p className="mt-2 text-sm text-coral">{error}</p>}
        <button
          type="submit"
          className="mt-5 w-full rounded-md bg-ocean py-2.5 font-semibold text-white hover:bg-ocean-deep"
        >
          Entrar
        </button>
        <p className="mt-4 text-center text-xs text-ink-muted">
          Demo: usa la contraseña <code>admin123</code>
        </p>
      </form>
    </div>
  );
}
