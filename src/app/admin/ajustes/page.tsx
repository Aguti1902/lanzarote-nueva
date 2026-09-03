"use client";

import { useEffect, useMemo, useState } from "react";
import type { Locale } from "@/i18n/config";
import type { SiteSettings } from "@/types";
import { Field, adminInput, adminTextarea } from "@/components/admin/Field";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import {
  pickSettingsTranslations,
  SETTINGS_TRANSLATABLE_KEYS,
  type SettingsTranslatableKey,
} from "@/lib/settings-i18n";

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

const localeTabs: { id: Locale; label: string }[] = [
  { id: "es", label: "Español" },
  { id: "en", label: "Inglés" },
  { id: "de", label: "Alemán" },
];

type SectionId =
  | "brand"
  | "home"
  | "about"
  | "excursions"
  | "blog"
  | "cruise"
  | "transfers";

const SECTION_KEYS: Record<SectionId, SettingsTranslatableKey[]> = {
  brand: ["tagline", "hours"],
  home: ["homeHeadline", "homeSubheadline"],
  about: [
    "aboutTitle",
    "aboutLead",
    "aboutText",
    "aboutValues",
    "aboutPromise",
  ],
  excursions: ["excursionsTitle", "excursionsIntro", "excursionsText"],
  blog: ["blogTitle", "blogIntro", "blogText"],
  cruise: ["cruiseHeadline", "cruiseIntro", "cruiseText"],
  transfers: ["transferTitle", "transferIntro", "transferText"],
};

function emptyOverlay(): Partial<SiteSettings> {
  return pickSettingsTranslations(
    Object.fromEntries(SETTINGS_TRANSLATABLE_KEYS.map((k) => [k, ""])) as Partial<SiteSettings>
  );
}

export default function AdminAjustesPage() {
  const [settings, setSettings] = useState<SiteSettings>(empty);
  const [en, setEn] = useState<Partial<SiteSettings>>(emptyOverlay());
  const [de, setDe] = useState<Partial<SiteSettings>>(emptyOverlay());
  const [locale, setLocale] = useState<Locale>("es");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const [esRes, enRes, deRes] = await Promise.all([
          fetch("/api/settings"),
          fetch("/api/admin/content-translations?locale=en"),
          fetch("/api/admin/content-translations?locale=de"),
        ]);
        const esData = await esRes.json();
        const enData = await enRes.json();
        const deData = await deRes.json();
        if (cancelled) return;
        setSettings({ ...empty, ...esData.settings });
        setEn({ ...emptyOverlay(), ...pickSettingsTranslations(enData.settings) });
        setDe({ ...emptyOverlay(), ...pickSettingsTranslations(deData.settings) });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const overlay = locale === "en" ? en : locale === "de" ? de : null;
  const setOverlay = locale === "en" ? setEn : locale === "de" ? setDe : null;

  function textValue(key: SettingsTranslatableKey): string {
    if (locale === "es") {
      const v = settings[key];
      return typeof v === "string" ? v : "";
    }
    const v = overlay?.[key];
    return typeof v === "string" ? v : "";
  }

  function setText(key: SettingsTranslatableKey, value: string) {
    if (locale === "es") {
      setSettings((prev) => ({ ...prev, [key]: value }));
      return;
    }
    setOverlay?.((prev) => ({ ...prev, [key]: value }));
  }

  function setShared<K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const esRes = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!esRes.ok) throw new Error("es");

      const [enRes, deRes] = await Promise.all([
        fetch("/api/admin/content-translations", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ locale: "en", settings: en }),
        }),
        fetch("/api/admin/content-translations", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ locale: "de", settings: de }),
        }),
      ]);
      if (!enRes.ok || !deRes.ok) throw new Error("i18n");

      setMessage(
        "Ajustes y traducciones guardados. Se reflejan en la web pública (puede tardar unos segundos por la caché)."
      );
    } catch {
      setMessage("Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  async function generateTranslations(section?: SectionId) {
    setGenerating(true);
    setMessage("");
    try {
      const keys = section
        ? SECTION_KEYS[section]
        : [...SETTINGS_TRANSLATABLE_KEYS];
      const source = pickSettingsTranslations(settings);
      const res = await fetch("/api/admin/translate-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source, keys }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "fail");

      const nextEn = {
        ...en,
        ...pickSettingsTranslations(data.translations?.en),
      };
      const nextDe = {
        ...de,
        ...pickSettingsTranslations(data.translations?.de),
      };
      setEn(nextEn);
      setDe(nextDe);

      if (locale === "es") setLocale("en");
      setMessage(
        data.mode === "openai"
          ? "Traducciones generadas (EN y DE). Revíselas y pulse Guardar."
          : "Borrador generado sin OpenAI (copia del español). Edite EN/DE y guarde. Configure OPENAI_API_KEY para traducción automática."
      );
    } catch {
      setMessage("No se pudieron generar las traducciones");
    } finally {
      setGenerating(false);
    }
  }

  const localeHint = useMemo(() => {
    if (locale === "es") {
      return "Editando textos en español (base). Las imágenes son comunes a todos los idiomas.";
    }
    return `Editando textos en ${locale === "en" ? "inglés" : "alemán"}. Vaciar un campo hace que la web use el español. Las imágenes no cambian por idioma.`;
  }, [locale]);

  if (loading) return <p className="text-ink-muted">Cargando…</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-ink">Ajustes de la web</h1>
          <p className="mt-1 max-w-2xl text-sm text-ink-muted">
            Textos e imágenes por página. En cada idioma puede editar los textos;
            puede generar EN/DE automáticamente y luego retocarlos.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {localeTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setLocale(tab.id)}
              className={`rounded px-4 py-2 text-sm font-bold ${
                locale === tab.id
                  ? "bg-ocean text-white"
                  : "bg-white text-ink ring-1 ring-sand-line"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-xl bg-white p-4 ring-1 ring-sand-line">
        <p className="text-sm text-ink-muted">{localeHint}</p>
        <button
          type="button"
          disabled={generating}
          onClick={() => generateTranslations()}
          className="ml-auto rounded bg-header px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
        >
          {generating ? "Generando…" : "Generar traducciones EN + DE"}
        </button>
      </div>

      {message && (
        <p className="rounded-lg bg-sky-soft px-4 py-2 text-sm text-ocean-deep ring-1 ring-sand-line">
          {message}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="grid gap-4 rounded-xl bg-white p-5 shadow-sm ring-1 ring-sand-line md:grid-cols-2">
          <div className="flex flex-wrap items-center justify-between gap-2 md:col-span-2">
            <h2 className="font-display text-xl">Contacto y marca</h2>
            {locale === "es" ? null : (
              <button
                type="button"
                disabled={generating}
                onClick={() => generateTranslations("brand")}
                className="text-xs font-bold text-ocean hover:underline disabled:opacity-50"
              >
                Generar esta sección
              </button>
            )}
          </div>
          {locale === "es" ? (
            <>
              <Field label="Nombre de marca">
                <input
                  className={adminInput}
                  value={settings.brandName}
                  onChange={(e) => setShared("brandName", e.target.value)}
                />
              </Field>
              <Field label="Teléfono">
                <input
                  className={adminInput}
                  value={settings.phone}
                  onChange={(e) => setShared("phone", e.target.value)}
                />
              </Field>
              <Field label="Email">
                <input
                  type="email"
                  className={adminInput}
                  value={settings.email}
                  onChange={(e) => setShared("email", e.target.value)}
                />
              </Field>
            </>
          ) : (
            <p className="text-sm text-ink-muted md:col-span-2">
              Nombre, teléfono y email son comunes (no se traducen).
            </p>
          )}
          <Field label="Eslogan corto">
            <input
              className={adminInput}
              value={textValue("tagline")}
              onChange={(e) => setText("tagline", e.target.value)}
            />
          </Field>
          <Field label="Horario" className="md:col-span-2">
            <input
              className={adminInput}
              value={textValue("hours")}
              onChange={(e) => setText("hours", e.target.value)}
            />
          </Field>
        </section>

        <section className="space-y-4 rounded-xl bg-white p-5 shadow-sm ring-1 ring-sand-line">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-xl">Inicio</h2>
            {locale !== "es" && (
              <button
                type="button"
                disabled={generating}
                onClick={() => generateTranslations("home")}
                className="text-xs font-bold text-ocean hover:underline disabled:opacity-50"
              >
                Generar esta sección
              </button>
            )}
          </div>
          <Field label="Titular">
            <input
              className={adminInput}
              value={textValue("homeHeadline")}
              onChange={(e) => setText("homeHeadline", e.target.value)}
            />
          </Field>
          <Field label="Subtítulo">
            <textarea
              className={adminTextarea}
              value={textValue("homeSubheadline")}
              onChange={(e) => setText("homeSubheadline", e.target.value)}
            />
          </Field>
          <ImageUploadField
            label="Imagen hero inicio"
            folder="home"
            value={settings.homeHeroImage}
            onChange={(url) => setShared("homeHeroImage", url)}
            objectPosition={settings.homeHeroPosition}
            onObjectPositionChange={(pos) => setShared("homeHeroPosition", pos)}
            aspectRatio={16 / 9}
            hint={HERO_HINT}
          />
        </section>

        <section className="space-y-4 rounded-xl bg-white p-5 shadow-sm ring-1 ring-sand-line">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-xl">Sobre nosotros</h2>
            {locale !== "es" && (
              <button
                type="button"
                disabled={generating}
                onClick={() => generateTranslations("about")}
                className="text-xs font-bold text-ocean hover:underline disabled:opacity-50"
              >
                Generar esta sección
              </button>
            )}
          </div>
          <Field label="Título">
            <input
              className={adminInput}
              value={textValue("aboutTitle")}
              onChange={(e) => setText("aboutTitle", e.target.value)}
            />
          </Field>
          <Field label="Entradilla">
            <textarea
              className={adminTextarea}
              value={textValue("aboutLead")}
              onChange={(e) => setText("aboutLead", e.target.value)}
            />
          </Field>
          <Field label="Texto completo (párrafos con línea en blanco)">
            <textarea
              className={`${adminTextarea} min-h-[200px]`}
              value={textValue("aboutText")}
              onChange={(e) => setText("aboutText", e.target.value)}
            />
          </Field>
          <Field label="Valores (uno por línea)">
            <textarea
              className={adminTextarea}
              value={textValue("aboutValues")}
              onChange={(e) => setText("aboutValues", e.target.value)}
            />
          </Field>
          <Field label="Promesa">
            <textarea
              className={adminTextarea}
              value={textValue("aboutPromise")}
              onChange={(e) => setText("aboutPromise", e.target.value)}
            />
          </Field>
          <ImageUploadField
            label="Imagen hero / principal"
            folder="about"
            value={settings.aboutImage}
            onChange={(url) => setShared("aboutImage", url)}
            objectPosition={settings.aboutHeroPosition}
            onObjectPositionChange={(pos) => setShared("aboutHeroPosition", pos)}
            aspectRatio={16 / 9}
            hint={HERO_HINT}
          />
          <ImageUploadField
            label="Imagen secundaria"
            folder="about"
            value={settings.aboutImageSecondary}
            onChange={(url) => setShared("aboutImageSecondary", url)}
            aspectRatio={4 / 3}
          />
        </section>

        <section className="space-y-4 rounded-xl bg-white p-5 shadow-sm ring-1 ring-sand-line">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-xl">Excursiones</h2>
            {locale !== "es" && (
              <button
                type="button"
                disabled={generating}
                onClick={() => generateTranslations("excursions")}
                className="text-xs font-bold text-ocean hover:underline disabled:opacity-50"
              >
                Generar esta sección
              </button>
            )}
          </div>
          <Field label="Título">
            <input
              className={adminInput}
              value={textValue("excursionsTitle")}
              onChange={(e) => setText("excursionsTitle", e.target.value)}
            />
          </Field>
          <Field label="Entradilla">
            <textarea
              className={adminTextarea}
              value={textValue("excursionsIntro")}
              onChange={(e) => setText("excursionsIntro", e.target.value)}
            />
          </Field>
          <Field label="Texto completo (párrafos con línea en blanco)">
            <textarea
              className={`${adminTextarea} min-h-[160px]`}
              value={textValue("excursionsText")}
              onChange={(e) => setText("excursionsText", e.target.value)}
            />
          </Field>
          <ImageUploadField
            label="Imagen hero"
            folder="excursions"
            value={settings.excursionsHeroImage}
            onChange={(url) => setShared("excursionsHeroImage", url)}
            objectPosition={settings.excursionsHeroPosition}
            onObjectPositionChange={(pos) =>
              setShared("excursionsHeroPosition", pos)
            }
            aspectRatio={16 / 9}
            hint={HERO_HINT}
          />
        </section>

        <section className="space-y-4 rounded-xl bg-white p-5 shadow-sm ring-1 ring-sand-line">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-xl">Blog</h2>
            {locale !== "es" && (
              <button
                type="button"
                disabled={generating}
                onClick={() => generateTranslations("blog")}
                className="text-xs font-bold text-ocean hover:underline disabled:opacity-50"
              >
                Generar esta sección
              </button>
            )}
          </div>
          <Field label="Título">
            <input
              className={adminInput}
              value={textValue("blogTitle")}
              onChange={(e) => setText("blogTitle", e.target.value)}
            />
          </Field>
          <Field label="Entradilla">
            <textarea
              className={adminTextarea}
              value={textValue("blogIntro")}
              onChange={(e) => setText("blogIntro", e.target.value)}
            />
          </Field>
          <Field label="Texto completo (párrafos con línea en blanco)">
            <textarea
              className={`${adminTextarea} min-h-[160px]`}
              value={textValue("blogText")}
              onChange={(e) => setText("blogText", e.target.value)}
            />
          </Field>
          <ImageUploadField
            label="Imagen hero"
            folder="blog"
            value={settings.blogHeroImage}
            onChange={(url) => setShared("blogHeroImage", url)}
            objectPosition={settings.blogHeroPosition}
            onObjectPositionChange={(pos) => setShared("blogHeroPosition", pos)}
            aspectRatio={16 / 9}
            hint={HERO_HINT}
          />
        </section>

        <section className="space-y-4 rounded-xl bg-white p-5 shadow-sm ring-1 ring-sand-line">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-xl">Cruceristas</h2>
            {locale !== "es" && (
              <button
                type="button"
                disabled={generating}
                onClick={() => generateTranslations("cruise")}
                className="text-xs font-bold text-ocean hover:underline disabled:opacity-50"
              >
                Generar esta sección
              </button>
            )}
          </div>
          <Field label="Titular de bienvenida">
            <input
              className={adminInput}
              value={textValue("cruiseHeadline")}
              onChange={(e) => setText("cruiseHeadline", e.target.value)}
            />
          </Field>
          <Field label="Entradilla">
            <textarea
              className={adminTextarea}
              value={textValue("cruiseIntro")}
              onChange={(e) => setText("cruiseIntro", e.target.value)}
            />
          </Field>
          <Field label="Texto completo (párrafos con línea en blanco)">
            <textarea
              className={`${adminTextarea} min-h-[160px]`}
              value={textValue("cruiseText")}
              onChange={(e) => setText("cruiseText", e.target.value)}
            />
          </Field>
          <ImageUploadField
            label="Imagen hero"
            folder="cruise"
            value={settings.cruiseHeroImage}
            onChange={(url) => setShared("cruiseHeroImage", url)}
            objectPosition={settings.cruiseHeroPosition}
            onObjectPositionChange={(pos) => setShared("cruiseHeroPosition", pos)}
            aspectRatio={16 / 9}
            hint={HERO_HINT}
          />
        </section>

        <section className="space-y-4 rounded-xl bg-white p-5 shadow-sm ring-1 ring-sand-line">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-xl">Traslados</h2>
            {locale !== "es" && (
              <button
                type="button"
                disabled={generating}
                onClick={() => generateTranslations("transfers")}
                className="text-xs font-bold text-ocean hover:underline disabled:opacity-50"
              >
                Generar esta sección
              </button>
            )}
          </div>
          <Field label="Título">
            <input
              className={adminInput}
              value={textValue("transferTitle")}
              onChange={(e) => setText("transferTitle", e.target.value)}
            />
          </Field>
          <Field label="Entradilla">
            <textarea
              className={adminTextarea}
              value={textValue("transferIntro")}
              onChange={(e) => setText("transferIntro", e.target.value)}
            />
          </Field>
          <Field label="Texto completo (párrafos con línea en blanco)">
            <textarea
              className={`${adminTextarea} min-h-[200px]`}
              value={textValue("transferText")}
              onChange={(e) => setText("transferText", e.target.value)}
            />
          </Field>
          <ImageUploadField
            label="Imagen hero"
            folder="transfers"
            value={settings.transferHeroImage}
            onChange={(url) => setShared("transferHeroImage", url)}
            objectPosition={settings.transferHeroPosition}
            onObjectPositionChange={(pos) =>
              setShared("transferHeroPosition", pos)
            }
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
            onChange={(url) => setShared("housesHeroImage", url)}
            objectPosition={settings.housesHeroPosition}
            onObjectPositionChange={(pos) => setShared("housesHeroPosition", pos)}
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
            onChange={(url) => setShared("contactHeroImage", url)}
            objectPosition={settings.contactHeroPosition}
            onObjectPositionChange={(pos) =>
              setShared("contactHeroPosition", pos)
            }
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
          <h2 className="font-display text-xl md:col-span-2">
            Datos fiscales (facturas)
          </h2>
          <Field label="Razón social">
            <input
              className={adminInput}
              value={settings.companyLegalName || ""}
              onChange={(e) => setShared("companyLegalName", e.target.value)}
            />
          </Field>
          <Field label="NIF / CIF">
            <input
              className={adminInput}
              value={settings.companyTaxId || ""}
              onChange={(e) => setShared("companyTaxId", e.target.value)}
            />
          </Field>
          <Field label="Dirección fiscal" className="md:col-span-2">
            <input
              className={adminInput}
              value={settings.companyAddress || ""}
              onChange={(e) => setShared("companyAddress", e.target.value)}
            />
          </Field>
          <Field label="% IGIC">
            <input
              type="number"
              min={0}
              max={30}
              step={0.1}
              className={adminInput}
              value={settings.taxRate ?? 7}
              onChange={(e) => setShared("taxRate", Number(e.target.value))}
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
          {saving ? "Guardando…" : "Guardar ajustes y traducciones"}
        </button>
      </form>
    </div>
  );
}
