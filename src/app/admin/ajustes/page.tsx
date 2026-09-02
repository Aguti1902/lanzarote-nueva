"use client";

import { useEffect, useState } from "react";
import type { SiteSettings } from "@/types";
import { Field, adminInput, adminTextarea } from "@/components/admin/Field";
import { ImageUploadField } from "@/components/admin/ImageUploadField";

const empty: SiteSettings = {
  brandName: "",
  tagline: "",
  phone: "",
  email: "",
  hours: "",
  homeHeadline: "",
  homeSubheadline: "",
  homeHeroImage: "",
  homeHeroPosition: "50% 50%",
  aboutTitle: "",
  aboutLead: "",
  aboutText: "",
  aboutImage: "",
  aboutImageSecondary: "",
  aboutHeroPosition: "50% 40%",
  aboutValues: "",
  aboutPromise: "",
  excursionsTitle: "",
  excursionsIntro: "",
  excursionsText: "",
  excursionsHeroImage: "",
  excursionsHeroPosition: "50% 40%",
  blogTitle: "",
  blogIntro: "",
  blogText: "",
  blogHeroImage: "",
  blogHeroPosition: "50% 40%",
  cruiseHeadline: "",
  cruiseIntro: "",
  cruiseText: "",
  cruiseHeroImage: "",
  cruiseHeroPosition: "50% 45%",
  transferTitle: "",
  transferIntro: "",
  transferText: "",
  transferHeroImage: "",
  transferHeroPosition: "50% 45%",
  housesHeroImage: "",
  housesHeroPosition: "50% 40%",
  contactHeroImage: "",
  contactHeroPosition: "50% 40%",
  companyLegalName: "",
  companyTaxId: "",
  companyAddress: "",
  taxRate: 7,
  bannerEs: "",
  bannerEn: "",
  bannerDe: "",
};

const HERO_HINT =
  "Puedes recortar la foto y, además, mover el encuadre (horizontal/vertical) para que se vea bien en la web. Guarda al terminar.";

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
          Título, entradilla y texto completo por página. Las imágenes se suben
          desde el ordenador; en cada hero puedes recortar y ajustar el encuadre.
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
          <ImageUploadField
            label="Imagen hero inicio"
            folder="home"
            value={settings.homeHeroImage}
            onChange={(url) => set("homeHeroImage", url)}
            objectPosition={settings.homeHeroPosition}
            onObjectPositionChange={(pos) => set("homeHeroPosition", pos)}
            aspectRatio={16 / 9}
            hint={HERO_HINT}
          />
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
          <ImageUploadField
            label="Imagen hero / principal"
            folder="about"
            value={settings.aboutImage}
            onChange={(url) => set("aboutImage", url)}
            objectPosition={settings.aboutHeroPosition}
            onObjectPositionChange={(pos) => set("aboutHeroPosition", pos)}
            aspectRatio={16 / 9}
            hint={HERO_HINT}
          />
          <ImageUploadField
            label="Imagen secundaria"
            folder="about"
            value={settings.aboutImageSecondary}
            onChange={(url) => set("aboutImageSecondary", url)}
            aspectRatio={4 / 3}
          />
        </section>

        <section className="space-y-4 rounded-xl bg-white p-5 shadow-sm ring-1 ring-sand-line">
          <h2 className="font-display text-xl">Excursiones</h2>
          <Field label="Título">
            <input className={adminInput} value={settings.excursionsTitle} onChange={(e) => set("excursionsTitle", e.target.value)} />
          </Field>
          <Field label="Entradilla">
            <textarea className={adminTextarea} value={settings.excursionsIntro} onChange={(e) => set("excursionsIntro", e.target.value)} />
          </Field>
          <Field label="Texto completo (párrafos con línea en blanco)">
            <textarea
              className={`${adminTextarea} min-h-[160px]`}
              value={settings.excursionsText}
              onChange={(e) => set("excursionsText", e.target.value)}
            />
          </Field>
          <ImageUploadField
            label="Imagen hero"
            folder="excursions"
            value={settings.excursionsHeroImage}
            onChange={(url) => set("excursionsHeroImage", url)}
            objectPosition={settings.excursionsHeroPosition}
            onObjectPositionChange={(pos) => set("excursionsHeroPosition", pos)}
            aspectRatio={16 / 9}
            hint={HERO_HINT}
          />
        </section>

        <section className="space-y-4 rounded-xl bg-white p-5 shadow-sm ring-1 ring-sand-line">
          <h2 className="font-display text-xl">Blog</h2>
          <Field label="Título">
            <input className={adminInput} value={settings.blogTitle} onChange={(e) => set("blogTitle", e.target.value)} />
          </Field>
          <Field label="Entradilla">
            <textarea className={adminTextarea} value={settings.blogIntro} onChange={(e) => set("blogIntro", e.target.value)} />
          </Field>
          <Field label="Texto completo (párrafos con línea en blanco)">
            <textarea
              className={`${adminTextarea} min-h-[160px]`}
              value={settings.blogText}
              onChange={(e) => set("blogText", e.target.value)}
            />
          </Field>
          <ImageUploadField
            label="Imagen hero"
            folder="blog"
            value={settings.blogHeroImage}
            onChange={(url) => set("blogHeroImage", url)}
            objectPosition={settings.blogHeroPosition}
            onObjectPositionChange={(pos) => set("blogHeroPosition", pos)}
            aspectRatio={16 / 9}
            hint={HERO_HINT}
          />
        </section>

        <section className="space-y-4 rounded-xl bg-white p-5 shadow-sm ring-1 ring-sand-line">
          <h2 className="font-display text-xl">Cruceristas</h2>
          <Field label="Titular de bienvenida">
            <input className={adminInput} value={settings.cruiseHeadline} onChange={(e) => set("cruiseHeadline", e.target.value)} />
          </Field>
          <Field label="Entradilla">
            <textarea className={adminTextarea} value={settings.cruiseIntro} onChange={(e) => set("cruiseIntro", e.target.value)} />
          </Field>
          <Field label="Texto completo (párrafos con línea en blanco)">
            <textarea
              className={`${adminTextarea} min-h-[160px]`}
              value={settings.cruiseText}
              onChange={(e) => set("cruiseText", e.target.value)}
            />
          </Field>
          <ImageUploadField
            label="Imagen hero"
            folder="cruise"
            value={settings.cruiseHeroImage}
            onChange={(url) => set("cruiseHeroImage", url)}
            objectPosition={settings.cruiseHeroPosition}
            onObjectPositionChange={(pos) => set("cruiseHeroPosition", pos)}
            aspectRatio={16 / 9}
            hint={HERO_HINT}
          />
        </section>

        <section className="space-y-4 rounded-xl bg-white p-5 shadow-sm ring-1 ring-sand-line">
          <h2 className="font-display text-xl">Traslados</h2>
          <Field label="Título">
            <input
              className={adminInput}
              value={settings.transferTitle}
              onChange={(e) => set("transferTitle", e.target.value)}
            />
          </Field>
          <Field label="Entradilla">
            <textarea
              className={adminTextarea}
              value={settings.transferIntro}
              onChange={(e) => set("transferIntro", e.target.value)}
            />
          </Field>
          <Field label="Texto completo (párrafos con línea en blanco)">
            <textarea
              className={`${adminTextarea} min-h-[200px]`}
              value={settings.transferText}
              onChange={(e) => set("transferText", e.target.value)}
            />
          </Field>
          <ImageUploadField
            label="Imagen hero"
            folder="transfers"
            value={settings.transferHeroImage}
            onChange={(url) => set("transferHeroImage", url)}
            objectPosition={settings.transferHeroPosition}
            onObjectPositionChange={(pos) => set("transferHeroPosition", pos)}
            aspectRatio={16 / 9}
            hint={HERO_HINT}
          />
        </section>

        <section className="space-y-4 rounded-xl bg-white p-5 shadow-sm ring-1 ring-sand-line">
          <h2 className="font-display text-xl">Casas vacacionales</h2>
          <ImageUploadField
            label="Imagen hero"
            folder="houses"
            value={settings.housesHeroImage || ""}
            onChange={(url) => set("housesHeroImage", url)}
            objectPosition={settings.housesHeroPosition}
            onObjectPositionChange={(pos) => set("housesHeroPosition", pos)}
            aspectRatio={16 / 9}
            hint={HERO_HINT}
          />
        </section>

        <section className="space-y-4 rounded-xl bg-white p-5 shadow-sm ring-1 ring-sand-line">
          <h2 className="font-display text-xl">Contacto</h2>
          <ImageUploadField
            label="Imagen hero"
            folder="contact"
            value={settings.contactHeroImage || ""}
            onChange={(url) => set("contactHeroImage", url)}
            objectPosition={settings.contactHeroPosition}
            onObjectPositionChange={(pos) => set("contactHeroPosition", pos)}
            aspectRatio={16 / 9}
            hint={HERO_HINT}
          />
        </section>

        <section className="grid gap-4 rounded-xl bg-white p-5 shadow-sm ring-1 ring-sand-line">
          <h2 className="font-display text-xl">Banner de la web</h2>
          <p className="text-sm text-ink-muted">
            El banner multiidioma se gestiona en su propia sección del menú.
          </p>
          <a
            href="/admin/banner"
            className="w-fit text-sm font-bold text-ocean hover:underline"
          >
            Ir a Banner →
          </a>
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
          <Field label="% IGIC">
            <input
              type="number"
              min={0}
              max={30}
              step={0.1}
              className={adminInput}
              value={settings.taxRate ?? 7}
              onChange={(e) => set("taxRate", Number(e.target.value))}
            />
          </Field>
          <p className="text-xs text-ink-muted md:col-span-2">
            En Canarias se aplica IGIC (no IVA). Valor habitual del servicio: 7%.
          </p>
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
