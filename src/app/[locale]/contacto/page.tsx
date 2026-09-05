"use client";

import { FormEvent, useEffect, useState } from "react";
import { Mail, MapPin, Phone } from "lucide-react";
import { PageContentBlocks } from "@/components/PageContentBlocks";
import { PageFaqs } from "@/components/PageFaqs";
import { PageHero } from "@/components/PageHero";
import { useLocale } from "@/components/LocaleProvider";
import { useSettingsHero } from "@/hooks/useSettingsHero";
import type { PageContentBlock, PageFaqItem, SiteSettings } from "@/types";

const inputClass =
  "w-full rounded border border-sand-line bg-white px-3 py-2.5 text-sm outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/20";

export default function ContactoPage() {
  const { dict, locale } = useLocale();
  const hero = useSettingsHero("contact");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState(false);
  const [faqTitle, setFaqTitle] = useState("");
  const [faqs, setFaqs] = useState<PageFaqItem[]>([]);
  const [blocksTitle, setBlocksTitle] = useState("");
  const [blocksIntro, setBlocksIntro] = useState("");
  const [blocks, setBlocks] = useState<PageContentBlock[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [esRes, i18nRes] = await Promise.all([
          fetch("/api/settings"),
          locale === "es"
            ? Promise.resolve(null)
            : fetch(`/api/admin/content-translations?locale=${locale}`),
        ]);
        const esData = await esRes.json();
        const settings = (esData.settings || {}) as SiteSettings;
        let overlay: Partial<SiteSettings> = {};
        if (i18nRes?.ok) {
          const i18nData = await i18nRes.json();
          overlay = (i18nData.settings || {}) as Partial<SiteSettings>;
        }
        if (cancelled) return;
        setFaqTitle(
          (typeof overlay.contactFaqTitle === "string" &&
            overlay.contactFaqTitle.trim()) ||
            settings.contactFaqTitle ||
            ""
        );
        const overlayFaqs = overlay.contactFaqs;
        setFaqs(
          Array.isArray(overlayFaqs) && overlayFaqs.length > 0
            ? overlayFaqs
            : settings.contactFaqs || []
        );
        setBlocksTitle(
          (typeof overlay.contactBlocksTitle === "string" &&
            overlay.contactBlocksTitle.trim()) ||
            settings.contactBlocksTitle ||
            ""
        );
        setBlocksIntro(
          (typeof overlay.contactBlocksIntro === "string" &&
            overlay.contactBlocksIntro.trim()) ||
            settings.contactBlocksIntro ||
            ""
        );
        const overlayBlocks = overlay.contactBlocks;
        setBlocks(
          Array.isArray(overlayBlocks) && overlayBlocks.length > 0
            ? overlayBlocks
            : settings.contactBlocks || []
        );
      } catch {
        /* ignore */
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [locale]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setOk(false);
    setLoading(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, message }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error");
      setOk(true);
      setName("");
      setEmail("");
      setPhone("");
      setMessage("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <PageHero
        image={hero.image}
        title={dict.contact.title}
        subtitle={dict.contact.subtitle}
        objectPosition={hero.objectPosition}
      />

      <section className="mx-auto grid max-w-6xl gap-12 px-4 py-14 md:grid-cols-2 md:px-6">
        <div>
          <h2 className="text-2xl font-bold text-ink">{dict.contact.formTitle}</h2>
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink-muted">
                {dict.contact.name}
              </label>
              <input
                className={inputClass}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink-muted">
                {dict.common.email}
              </label>
              <input
                type="email"
                className={inputClass}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink-muted">
                {dict.common.phone}
              </label>
              <input
                className={inputClass}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink-muted">
                {dict.contact.message}
              </label>
              <textarea
                className={`${inputClass} min-h-[140px]`}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            {ok && (
              <p className="text-sm text-success">{dict.contact.success}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary disabled:opacity-60"
            >
              {loading ? dict.contact.sending : dict.contact.send}
            </button>
          </form>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-ink">{dict.contact.infoTitle}</h2>
          <ul className="mt-6 space-y-4 text-sm text-ink-muted">
            <li className="flex items-start gap-3">
              <Phone className="mt-0.5 h-4 w-4 text-ocean" />
              <a href="tel:+34646080585" className="hover:text-ocean">
                +34 646 08 05 85
              </a>
            </li>
            <li className="flex items-start gap-3">
              <Mail className="mt-0.5 h-4 w-4 text-ocean" />
              <a
                href="mailto:support@lanzaroteexperiencetours.com"
                className="hover:text-ocean"
              >
                support@lanzaroteexperiencetours.com
              </a>
            </li>
            <li className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-4 w-4 text-ocean" />
              <span className="whitespace-pre-line">{dict.contact.address}</span>
            </li>
          </ul>
          <p className="mt-6 text-sm text-ink-muted">
            Agencia Nº: I-AV-0002407.1
          </p>
        </div>
      </section>

      <PageContentBlocks
        title={blocksTitle}
        intro={blocksIntro}
        blocks={blocks}
      />

      <PageFaqs title={faqTitle} faqs={faqs} tone="soft" />
    </>
  );
}
