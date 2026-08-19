"use client";

import { useEffect, useState } from "react";
import type { SiteSettings } from "@/types";
import { Field, adminInput, adminTextarea } from "@/components/admin/Field";

const empty: SiteSettings = {
  brandName: "",
  tagline: "",
  phone: "",
  email: "",
  hours: "",
  homeHeadline: "",
  homeSubheadline: "",
  homeHeroImage: "",
  aboutTitle: "",
  aboutLead: "",
  aboutText: "",
  aboutImage: "",
  aboutImageSecondary: "",
  aboutValues: "",
  aboutPromise: "",
  excursionsTitle: "",
  excursionsIntro: "",
  excursionsHeroImage: "",
  blogTitle: "",
  blogIntro: "",
  blogHeroImage: "",
  cruiseHeadline: "",
  cruiseIntro: "",
  cruiseHeroImage: "",
  transferIntro: "",
  transferHeroImage: "",
  companyLegalName: "",
  companyTaxId: "",
  companyAddress: "",
  taxRate: 0,
  bannerEs: "",
  bannerEn: "",
  bannerDe: "",
};

export default function AdminAjustesPage() {
  const [settings, setSettings] = useState<SiteSettings>(empty);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        setSettings({ ...empty, ...d.settings });
        setLoading(false);
      });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
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
    setMessage("Ajustes guardados. Se reflejan en la web pública.");
  }

  function set<K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  if (loading) return <p className="text-ink-muted">Cargando…</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-ink">Ajustes de la web</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Textos, imágenes de cabecera y datos de contacto. Todo sincronizado con
          la web pública.
        </p>
      </div>

      {message && (
        <p className="rounded-lg bg-sky-soft px-4 py-2 text-sm text-ocean-deep ring-1 ring-sand-line">
          {message}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="grid gap-4 rounded-xl bg-white p-5 shadow-sm ring-1 ring-sand-line md:grid-cols-2">
          <h2 className="font-display text-xl md:col-span-2">Contacto y marca</h2>
          <Field label="Nombre de marca">
            <input className={adminInput} value={settings.brandName} onChange={(e) => set("brandName", e.target.value)} />
          </Field>
          <Field label="Eslogan corto">
            <input className={adminInput} value={settings.tagline} onChange={(e) => set("tagline", e.target.value)} />
          </Field>
          <Field label="Teléfono">
            <input className={adminInput} value={settings.phone} onChange={(e) => set("phone", e.target.value)} />
          </Field>
          <Field label="Email">
            <input type="email" className={adminInput} value={settings.email} onChange={(e) => set("email", e.target.value)} />
          </Field>
          <Field label="Horario" className="md:col-span-2">
            <input className={adminInput} value={settings.hours} onChange={(e) => set("hours", e.target.value)} />
          </Field>
        </section>

        <section className="space-y-4 rounded-xl bg-white p-5 shadow-sm ring-1 ring-sand-line">
          <h2 className="font-display text-xl">Inicio</h2>
          <Field label="Titular">
            <input className={adminInput} value={settings.homeHeadline} onChange={(e) => set("homeHeadline", e.target.value)} />
          </Field>
          <Field label="Subtítulo">
            <textarea className={adminTextarea} value={settings.homeSubheadline} onChange={(e) => set("homeSubheadline", e.target.value)} />
          </Field>
          <Field label="URL imagen hero inicio">
            <input className={adminInput} value={settings.homeHeroImage} onChange={(e) => set("homeHeroImage", e.target.value)} />
          </Field>
        </section>

        <section className="space-y-4 rounded-xl bg-white p-5 shadow-sm ring-1 ring-sand-line">
          <h2 className="font-display text-xl">Sobre nosotros</h2>
          <Field label="Título">
            <input className={adminInput} value={settings.aboutTitle} onChange={(e) => set("aboutTitle", e.target.value)} />
          </Field>
          <Field label="Entradilla">
            <textarea className={adminTextarea} value={settings.aboutLead} onChange={(e) => set("aboutLead", e.target.value)} />
          </Field>
          <Field label="Texto completo (párrafos con línea en blanco)">
            <textarea className={`${adminTextarea} min-h-[200px]`} value={settings.aboutText} onChange={(e) => set("aboutText", e.target.value)} />
          </Field>
          <Field label="Valores (uno por línea)">
            <textarea className={adminTextarea} value={settings.aboutValues} onChange={(e) => set("aboutValues", e.target.value)} />
          </Field>
          <Field label="Promesa">
            <textarea className={adminTextarea} value={settings.aboutPromise} onChange={(e) => set("aboutPromise", e.target.value)} />
          </Field>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="URL imagen principal">
              <input className={adminInput} value={settings.aboutImage} onChange={(e) => set("aboutImage", e.target.value)} />
            </Field>
            <Field label="URL imagen secundaria">
              <input className={adminInput} value={settings.aboutImageSecondary} onChange={(e) => set("aboutImageSecondary", e.target.value)} />
            </Field>
          </div>
        </section>

        <section className="space-y-4 rounded-xl bg-white p-5 shadow-sm ring-1 ring-sand-line">
          <h2 className="font-display text-xl">Excursiones</h2>
          <Field label="Título">
            <input className={adminInput} value={settings.excursionsTitle} onChange={(e) => set("excursionsTitle", e.target.value)} />
          </Field>
          <Field label="Introducción">
            <textarea className={adminTextarea} value={settings.excursionsIntro} onChange={(e) => set("excursionsIntro", e.target.value)} />
          </Field>
          <Field label="URL imagen hero">
            <input className={adminInput} value={settings.excursionsHeroImage} onChange={(e) => set("excursionsHeroImage", e.target.value)} />
          </Field>
        </section>

        <section className="space-y-4 rounded-xl bg-white p-5 shadow-sm ring-1 ring-sand-line">
          <h2 className="font-display text-xl">Blog</h2>
          <Field label="Título">
            <input className={adminInput} value={settings.blogTitle} onChange={(e) => set("blogTitle", e.target.value)} />
          </Field>
          <Field label="Introducción">
            <textarea className={adminTextarea} value={settings.blogIntro} onChange={(e) => set("blogIntro", e.target.value)} />
          </Field>
          <Field label="URL imagen hero">
            <input className={adminInput} value={settings.blogHeroImage} onChange={(e) => set("blogHeroImage", e.target.value)} />
          </Field>
        </section>

        <section className="space-y-4 rounded-xl bg-white p-5 shadow-sm ring-1 ring-sand-line">
          <h2 className="font-display text-xl">Cruceristas</h2>
          <Field label="Titular de bienvenida">
            <input className={adminInput} value={settings.cruiseHeadline} onChange={(e) => set("cruiseHeadline", e.target.value)} />
          </Field>
          <Field label="Texto de bienvenida">
            <textarea className={adminTextarea} value={settings.cruiseIntro} onChange={(e) => set("cruiseIntro", e.target.value)} />
          </Field>
          <Field label="URL imagen hero">
            <input className={adminInput} value={settings.cruiseHeroImage} onChange={(e) => set("cruiseHeroImage", e.target.value)} />
          </Field>
        </section>

        <section className="space-y-4 rounded-xl bg-white p-5 shadow-sm ring-1 ring-sand-line">
          <h2 className="font-display text-xl">Traslados</h2>
          <Field label="Texto introductorio">
            <textarea className={adminTextarea} value={settings.transferIntro} onChange={(e) => set("transferIntro", e.target.value)} />
          </Field>
          <Field label="URL imagen hero">
            <input className={adminInput} value={settings.transferHeroImage} onChange={(e) => set("transferHeroImage", e.target.value)} />
          </Field>
        </section>

        <section className="grid gap-4 rounded-xl bg-white p-5 shadow-sm ring-1 ring-sand-line">
          <h2 className="font-display text-xl">Banner de la web (multiidioma)</h2>
          <p className="text-sm text-ink-muted">
            Mensaje del marquee / cinta superior. Si deja un idioma vacío, se usa el texto por defecto del idioma.
          </p>
          <Field label="Español">
            <textarea
              className={adminTextarea}
              value={settings.bannerEs || ""}
              onChange={(e) => set("bannerEs", e.target.value)}
            />
          </Field>
          <Field label="Inglés">
            <textarea
              className={adminTextarea}
              value={settings.bannerEn || ""}
              onChange={(e) => set("bannerEn", e.target.value)}
            />
          </Field>
          <Field label="Alemán">
            <textarea
              className={adminTextarea}
              value={settings.bannerDe || ""}
              onChange={(e) => set("bannerDe", e.target.value)}
            />
          </Field>
        </section>

        <section className="grid gap-4 rounded-xl bg-white p-5 shadow-sm ring-1 ring-sand-line md:grid-cols-2">
          <h2 className="font-display text-xl md:col-span-2">Datos fiscales (facturas)</h2>
          <Field label="Razón social">
            <input className={adminInput} value={settings.companyLegalName || ""} onChange={(e) => set("companyLegalName", e.target.value)} />
          </Field>
          <Field label="NIF / CIF">
            <input className={adminInput} value={settings.companyTaxId || ""} onChange={(e) => set("companyTaxId", e.target.value)} />
          </Field>
          <Field label="Dirección fiscal" className="md:col-span-2">
            <input className={adminInput} value={settings.companyAddress || ""} onChange={(e) => set("companyAddress", e.target.value)} />
          </Field>
          <Field label="% IVA">
            <input
              type="number"
              min={0}
              max={30}
              className={adminInput}
              value={settings.taxRate ?? 0}
              onChange={(e) => set("taxRate", Number(e.target.value))}
            />
          </Field>
        </section>

        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-ocean px-6 py-2.5 text-sm font-semibold text-white hover:bg-ocean-deep disabled:opacity-60"
        >
          {saving ? "Guardando…" : "Guardar ajustes"}
        </button>
      </form>
    </div>
  );
}
