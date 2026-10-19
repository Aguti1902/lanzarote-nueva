"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { formatPrice } from "@/lib/format";

type PhraseHit = { phrase: string; count: number; sites: string[] };

type Desk = {
  programStart: string;
  slugPolicy: string;
  rules: string[];
  controlQueries: { q: string; locale: string; country: string; page: string }[];
  today: {
    date: string;
    monthNumber: number;
    monthLabel: string;
    dayInMonth: number;
    kind: string;
    goal: string;
    ficha: {
      id: string;
      name: string;
      hours: string;
      note: string;
      urls: { es: string; en: string; de: string } | null;
    };
  };
  upcoming: { date: string; kind: string; ficha: { name: string } }[];
  kindLabels: Record<string, string>;
  ga: {
    measurementId: string;
    source: "env" | "panel" | "none";
    envLocksPanel: boolean;
    trackingReady: boolean;
    numbers: "sin dato";
  };
  searchConsole: "sin dato";
  journal: {
    id: string;
    date: string;
    kind: string;
    fichaName: string;
    summary: string;
    createdAt: string;
  }[];
  snapshots: {
    fetchedAt: string;
    pages: {
      url: string;
      role: "propia" | "competencia";
      ok: boolean;
      status: number;
      title: string;
      description: string;
      error: string;
    }[];
  } | null;
  keywords: {
    shared: PhraseHit[];
    onlyCompetitors: PhraseHit[];
    note: string;
  } | null;
  bookings: {
    from: string;
    to: string;
    reservations: number;
    collected: number;
    byLocale: { locale: string; count: number }[];
    bySource: { source: string; count: number }[];
    top: { title: string; count: number; collected: number; pax: number }[];
    quiet: { id: string; title: string }[];
    quietTotal: number;
    fichaDemand: { id: string; name: string; count: number; collected: number }[];
    note: string;
  };
  fichaCopy: {
    tourId: string;
    priceNote: string;
    es: { h1: string; seoTitle: string; seoDescription: string };
    en: { h1: string; seoTitle: string; seoDescription: string };
    de: { h1: string; seoTitle: string; seoDescription: string };
  } | null;
  approvedCopy: {
    title: { es: string; en: string; de: string };
    description: { es: string; en: string; de: string };
  } | null;
  editHref: string | null;
};

function label(desk: Desk, kind: string) {
  return desk.kindLabels[kind] || kind;
}

export default function AdminSeoPage() {
  const [desk, setDesk] = useState<Desk | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [note, setNote] = useState("");
  const [gaId, setGaId] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/seo");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudo cargar el SEO");
      setDesk(data);
      setGaId(data.ga?.source === "panel" ? data.ga.measurementId : data.ga?.measurementId || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cargar el SEO");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function post(action: string, extra: Record<string, string> = {}) {
    setBusy(action);
    setError("");
    try {
      const response = await fetch("/api/admin/seo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudo guardar");
      if (data.desk) {
        setDesk(data.desk);
        setGaId(
          data.desk.ga?.source === "panel"
            ? data.desk.ga.measurementId
            : data.desk.ga?.measurementId || ""
        );
      } else {
        await load();
      }
      if (action === "note") setNote("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar");
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-ink">SEO</h1>
          <p className="mt-1 max-w-2xl text-sm text-ink-muted">
            Calendario diario, reservas reales y títulos públicos de la competencia.
            Las posiciones de Google y las visitas siguen en «sin dato» hasta conectar
            Search Console y la API de Analytics.
          </p>
        </div>
        <button
          type="button"
          disabled={busy === "analyze"}
          onClick={() => post("analyze")}
          className="rounded-md bg-ocean px-4 py-2 text-sm font-semibold text-white hover:bg-ocean-deep disabled:opacity-60"
        >
          {busy === "analyze" ? "Leyendo webs…" : "Analizar hoy"}
        </button>
      </div>

      {error && (
        <p className="rounded-lg bg-coral/10 px-4 py-3 text-sm text-coral">{error}</p>
      )}
      {loading && !desk && <p className="text-ink-muted">Cargando el panel SEO…</p>}

      {desk && (
        <>
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <article className="rounded-lg bg-white p-5 ring-1 ring-sand-line">
              <p className="text-xs text-ink-muted">Paso de hoy</p>
              <p className="mt-2 text-lg font-bold">{label(desk, desk.today.kind)}</p>
              <p className="mt-1 text-sm text-ink-muted">
                {desk.today.date} · {desk.today.ficha.name}
              </p>
            </article>
            <article className="rounded-lg bg-white p-5 ring-1 ring-sand-line">
              <p className="text-xs text-ink-muted">Reservas, 90 días</p>
              <p className="mt-2 text-2xl font-bold">{desk.bookings.reservations}</p>
              <p className="mt-1 text-sm text-ink-muted">
                Cobrado {formatPrice(desk.bookings.collected)}
              </p>
            </article>
            <article className="rounded-lg bg-white p-5 ring-1 ring-sand-line">
              <p className="text-xs text-ink-muted">Google Analytics</p>
              <p className="mt-2 text-lg font-bold">
                {desk.ga.trackingReady ? "Código listo" : "Sin conectar"}
              </p>
              <p className="mt-1 text-sm text-ink-muted">Visitas: sin dato</p>
            </article>
            <article className="rounded-lg bg-white p-5 ring-1 ring-sand-line">
              <p className="text-xs text-ink-muted">Search Console</p>
              <p className="mt-2 text-lg font-bold">Sin dato</p>
              <p className="mt-1 text-sm text-ink-muted">No hay puestos anotados</p>
            </article>
          </section>

          <section className="rounded-lg bg-white p-5 ring-1 ring-sand-line">
            <p className="text-xs font-semibold uppercase tracking-wide text-ocean">
              {desk.today.monthLabel}
            </p>
            <h2 className="mt-2 text-xl font-bold">{desk.today.ficha.name}</h2>
            <p className="mt-3 text-sm leading-relaxed">{desk.today.goal}</p>
            <p className="mt-3 text-sm text-ink-muted">{desk.slugPolicy}</p>
            <p className="mt-2 text-sm text-ink-muted">{desk.today.ficha.note}</p>
            {desk.today.ficha.urls && (
              <ul className="mt-4 space-y-1 text-sm">
                {(["es", "en", "de"] as const).map((locale) => (
                  <li key={locale}>
                    <a
                      className="text-ocean underline"
                      href={desk.today.ficha.urls?.[locale]}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {locale.toUpperCase()} · {desk.today.ficha.urls?.[locale]}
                    </a>
                  </li>
                ))}
              </ul>
            )}
            {desk.editHref && (
              <Link href={desk.editHref} className="mt-4 inline-block text-sm font-semibold text-ocean">
                Editar esta ficha en el panel
              </Link>
            )}
          </section>

          {desk.fichaCopy && (
            <section className="rounded-lg bg-white p-5 ring-1 ring-sand-line">
              <h2 className="text-lg font-bold">Texto que está publicado</h2>
              <p className="mt-1 text-sm text-ink-muted">{desk.fichaCopy.priceNote}</p>
              <div className="mt-4 grid gap-4 lg:grid-cols-3">
                {(["es", "en", "de"] as const).map((locale) => {
                  const copy = desk.fichaCopy?.[locale];
                  return (
                    <article key={locale} className="rounded-md bg-sky-mist p-3 text-sm">
                      <p className="font-semibold uppercase">{locale}</p>
                      <p className="mt-2">
                        <span className="text-ink-muted">H1 · </span>
                        {copy?.h1 || "sin dato"}
                      </p>
                      <p className="mt-2">
                        <span className="text-ink-muted">Title · </span>
                        {copy?.seoTitle || "sin dato"}
                      </p>
                      <p className="mt-2">
                        <span className="text-ink-muted">Descripción · </span>
                        {copy?.seoDescription || "sin dato"}
                      </p>
                    </article>
                  );
                })}
              </div>
            </section>
          )}

          {desk.approvedCopy && (
            <section className="rounded-lg bg-white p-5 ring-1 ring-sand-line">
              <h2 className="text-lg font-bold">Borrador aprobado de Timanfaya</h2>
              <p className="mt-1 text-sm text-ink-muted">
                Sale de la propuesta. No se publica solo: hay que pegarlo en la ficha si el precio sigue coincidiendo.
              </p>
              <div className="mt-4 grid gap-4 lg:grid-cols-3">
                {(["es", "en", "de"] as const).map((locale) => (
                  <article key={locale} className="text-sm">
                    <p className="font-semibold uppercase">{locale}</p>
                    <p className="mt-2">{desk.approvedCopy?.title[locale]}</p>
                    <p className="mt-2 text-ink-muted">{desk.approvedCopy?.description[locale]}</p>
                  </article>
                ))}
              </div>
            </section>
          )}

          <section className="grid gap-6 lg:grid-cols-2">
            <article className="rounded-lg bg-white p-5 ring-1 ring-sand-line">
              <h2 className="text-lg font-bold">Qué se reserva</h2>
              <p className="mt-1 text-sm text-ink-muted">
                {desk.bookings.from} – {desk.bookings.to}. Sin canceladas ni pagos online abandonados.
              </p>
              <p className="mt-3 text-sm">{desk.bookings.note}</p>
              <ul className="mt-4 space-y-2 text-sm">
                {desk.bookings.top.map((row, index) => (
                  <li key={`${row.title}-${index}`} className="flex items-start justify-between gap-3">
                    <span>{row.title}</span>
                    <b className="shrink-0 text-right">
                      {row.count} · {formatPrice(row.collected)}
                    </b>
                  </li>
                ))}
                {desk.bookings.top.length === 0 && <li>Sin reservas en este periodo.</li>}
              </ul>
              <div className="mt-4 flex flex-wrap gap-3 text-xs text-ink-muted">
                {desk.bookings.byLocale.map((row) => (
                  <span key={row.locale}>
                    Idioma {row.locale}: {row.count}
                  </span>
                ))}
                {desk.bookings.bySource.map((row) => (
                  <span key={row.source}>
                    {row.source}: {row.count}
                  </span>
                ))}
              </div>
            </article>

            <article className="rounded-lg bg-white p-5 ring-1 ring-sand-line">
              <h2 className="text-lg font-bold">Fichas del programa</h2>
              <p className="mt-1 text-sm text-ink-muted">
                Reservas de esas fichas en los mismos 90 días. Cero reservas no significa que Google las ignore.
              </p>
              <ul className="mt-4 space-y-2 text-sm">
                {desk.bookings.fichaDemand.map((row) => (
                  <li key={row.id} className="flex justify-between gap-3">
                    <span>{row.name}</span>
                    <b>{row.count === 0 ? "0 reservas" : `${row.count} · ${formatPrice(row.collected)}`}</b>
                  </li>
                ))}
              </ul>
              <h3 className="mt-6 text-sm font-bold">
                Activas sin reserva en el periodo ({desk.bookings.quietTotal})
              </h3>
              <ul className="mt-2 space-y-1 text-sm text-ink-muted">
                {desk.bookings.quiet.map((row) => (
                  <li key={row.id}>{row.title}</li>
                ))}
              </ul>
            </article>
          </section>

          <section className="rounded-lg bg-white p-5 ring-1 ring-sand-line">
            <h2 className="text-lg font-bold">Palabras de la competencia</h2>
            <p className="mt-1 text-sm text-ink-muted">
              {desk.keywords?.note ||
                "Todavía no hay una lectura. «Analizar hoy» abre la home y la ficha del día, más las webs permitidas."}
            </p>
            {desk.keywords && (
              <div className="mt-4 grid gap-6 lg:grid-cols-2">
                <div>
                  <h3 className="text-sm font-bold">Ya las usamos</h3>
                  <ul className="mt-2 space-y-1 text-sm">
                    {desk.keywords.shared.length === 0 && <li>Ninguna frase compartida en esta lectura.</li>}
                    {desk.keywords.shared.map((hit) => (
                      <li key={hit.phrase}>
                        {hit.phrase}
                        <span className="text-ink-muted"> · {hit.sites.join(", ")}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-sm font-bold">Ellos la ponen y nosotros no</h3>
                  <ul className="mt-2 space-y-1 text-sm">
                    {desk.keywords.onlyCompetitors.length === 0 && (
                      <li>Ninguna frase distinta en los títulos leídos.</li>
                    )}
                    {desk.keywords.onlyCompetitors.map((hit) => (
                      <li key={hit.phrase}>
                        {hit.phrase}
                        <span className="text-ink-muted"> · {hit.sites.join(", ")}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
            {desk.snapshots && (
              <ul className="mt-6 space-y-3 text-sm">
                {desk.snapshots.pages.map((page) => (
                  <li key={page.url} className="rounded-md bg-sky-mist p-3">
                    <p className="font-semibold">
                      {page.role === "propia" ? "Nuestra" : "Competencia"} ·{" "}
                      {page.title ? "título leído" : "sin título"}
                    </p>
                    <p className="mt-1 break-all text-ink-muted">{page.url}</p>
                    <p className="mt-1">{page.title || page.error || "Sin título"}</p>
                    {page.description && <p className="mt-1 text-ink-muted">{page.description}</p>}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-lg bg-white p-5 ring-1 ring-sand-line">
            <h2 className="text-lg font-bold">Diario</h2>
            <p className="mt-1 text-sm text-ink-muted">
              Aquí queda lo que se analiza cada día desde este panel. El agente alojado en Cursor
              todavía no escribe en este diario: hace falta la cuenta de servicio del proyecto.
            </p>
            <form
              className="mt-4 space-y-2"
              onSubmit={(event) => {
                event.preventDefault();
                post("note", { text: note });
              }}
            >
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                rows={3}
                placeholder="Nota o borrador del día. No cambia la web."
                className="w-full rounded border border-sand-line bg-white px-3 py-2 text-sm"
              />
              <button
                type="submit"
                disabled={busy === "note"}
                className="rounded border border-sand-line bg-white px-3 py-2 text-sm font-medium hover:ring-1 hover:ring-ocean/30 disabled:opacity-60"
              >
                {busy === "note" ? "Guardando…" : "Guardar nota"}
              </button>
            </form>
            <ol className="mt-6 space-y-4">
              {desk.journal.length === 0 && (
                <li className="text-sm text-ink-muted">Todavía no hay entradas.</li>
              )}
              {desk.journal.map((entry) => (
                <li key={entry.id} className="border-t border-sand-line pt-4 text-sm">
                  <p className="font-semibold">
                    {entry.date} · {label(desk, entry.kind)} · {entry.fichaName}
                  </p>
                  <p className="mt-1 leading-relaxed">{entry.summary}</p>
                </li>
              ))}
            </ol>
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <article className="rounded-lg bg-white p-5 ring-1 ring-sand-line">
              <h2 className="text-lg font-bold">Calendario, 14 días</h2>
              <p className="mt-1 text-sm text-ink-muted">
                Programa desde {desk.programStart}, en fecha UTC.
              </p>
              <ul className="mt-4 space-y-2 text-sm">
                {desk.upcoming.map((step) => (
                  <li key={step.date} className="flex justify-between gap-3">
                    <span>
                      {step.date} · {label(desk, step.kind)}
                    </span>
                    <span className="text-ink-muted">{step.ficha.name}</span>
                  </li>
                ))}
              </ul>
            </article>
            <article className="rounded-lg bg-white p-5 ring-1 ring-sand-line">
              <h2 className="text-lg font-bold">15 búsquedas de control</h2>
              <p className="mt-1 text-sm text-ink-muted">
                La lista está fijada. Si aparece o no en Google: sin dato.
              </p>
              <ul className="mt-4 space-y-2 text-sm">
                {desk.controlQueries.map((query) => (
                  <li key={query.q}>
                    <b>{query.q}</b>
                    <span className="text-ink-muted">
                      {" "}
                      · {query.locale}/{query.country} · {query.page}
                    </span>
                  </li>
                ))}
              </ul>
            </article>
          </section>

          <section className="rounded-lg bg-white p-5 ring-1 ring-sand-line">
            <h2 className="text-lg font-bold">Conectar Google Analytics</h2>
            <p className="mt-1 text-sm leading-relaxed text-ink-muted">
              En la web publicada no hay etiqueta de Analytics. Pega el ID de medición
              de tu propiedad (empieza por G-). El código solo se carga si la persona acepta
              cookies de analítica. Esto no trae las cifras al panel: para ver visitas aquí
              haría falta la API de Google, y hoy sigue en «sin dato».
            </p>
            {desk.ga.envLocksPanel && (
              <p className="mt-3 text-sm">
                El servidor ya tiene un ID en la variable de entorno. Ese es el que usa la web.
              </p>
            )}
            <form
              className="mt-4 flex flex-wrap items-center gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                post("ga", { measurementId: gaId });
              }}
            >
              <input
                value={gaId}
                onChange={(event) => setGaId(event.target.value)}
                placeholder="G-XXXXXXXXXX"
                className="w-64 rounded border border-sand-line bg-white px-3 py-2 text-sm"
                autoComplete="off"
                spellCheck={false}
              />
              <button
                type="submit"
                disabled={busy === "ga" || desk.ga.envLocksPanel}
                className="rounded border border-sand-line bg-white px-3 py-2 text-sm font-medium hover:ring-1 hover:ring-ocean/30 disabled:opacity-60"
              >
                {busy === "ga" ? "Guardando…" : "Guardar ID"}
              </button>
            </form>
          </section>
        </>
      )}
    </div>
  );
}
