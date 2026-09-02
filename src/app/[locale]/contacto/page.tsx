"use client";

import { FormEvent, useState } from "react";
import { Mail, MapPin, Phone } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { useLocale } from "@/components/LocaleProvider";
import { useSettingsHero } from "@/hooks/useSettingsHero";

const inputClass =
  "w-full rounded border border-sand-line bg-white px-3 py-2.5 text-sm outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/20";

export default function ContactoPage() {
  const { dict } = useLocale();
  const hero = useSettingsHero("contact");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState(false);

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
        compact
        objectPosition={hero.objectPosition}
      />

      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-2 md:px-6">
        <div>
          <h2 className="text-2xl font-bold text-ink">{dict.contact.formTitle}</h2>
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="mb-1 block text-sm font-bold">
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
              <label className="mb-1 block text-sm font-bold">
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
              <label className="mb-1 block text-sm font-bold">
                {dict.common.phone}
              </label>
              <input
                className={inputClass}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-bold">
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
    </>
  );
}
