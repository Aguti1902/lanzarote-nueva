"use client";

import { useEffect, useState } from "react";
import type { SiteSettings } from "@/types";
import { Field, adminTextarea } from "@/components/admin/Field";

export default function AdminBannerPage() {
  const [bannerEs, setBannerEs] = useState("");
  const [bannerEn, setBannerEn] = useState("");
  const [bannerDe, setBannerDe] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        const s = (d.settings || {}) as SiteSettings;
        setBannerEs(s.bannerEs || "");
        setBannerEn(s.bannerEn || "");
        setBannerDe(s.bannerDe || "");
        setLoading(false);
      });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    const current = await fetch("/api/settings").then((r) => r.json());
    const settings = {
      ...(current.settings || {}),
      bannerEs,
      bannerEn,
      bannerDe,
    };
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    setSaving(false);
    if (!res.ok) {
      setMessage("Error al guardar");
      return;
    }
    setMessage("Banner guardado. Se refleja en la cinta superior de la web.");
  }

  if (loading) return <p className="text-ink-muted">Cargando…</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-ink">Banner</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Mensaje del marquee / cinta superior de la web pública (multiidioma).
          Si deja un idioma vacío, se usa el texto por defecto de ese idioma.
        </p>
      </div>

      {message && (
        <p className="rounded-lg bg-sky-soft px-4 py-2 text-sm text-ocean-deep ring-1 ring-sand-line">
          {message}
        </p>
      )}

      <form
        onSubmit={handleSubmit}
        className="grid max-w-3xl gap-4 rounded-xl bg-white p-5 shadow-sm ring-1 ring-sand-line"
      >
        <Field label="Español">
          <textarea
            className={adminTextarea}
            value={bannerEs}
            onChange={(e) => setBannerEs(e.target.value)}
          />
        </Field>
        <Field label="Inglés">
          <textarea
            className={adminTextarea}
            value={bannerEn}
            onChange={(e) => setBannerEn(e.target.value)}
          />
        </Field>
        <Field label="Alemán">
          <textarea
            className={adminTextarea}
            value={bannerDe}
            onChange={(e) => setBannerDe(e.target.value)}
          />
        </Field>
        <button
          type="submit"
          disabled={saving}
          className="w-fit rounded-md bg-ocean px-6 py-2.5 text-sm font-semibold text-white hover:bg-ocean-deep disabled:opacity-60"
        >
          {saving ? "Guardando…" : "Guardar banner"}
        </button>
      </form>
    </div>
  );
}
