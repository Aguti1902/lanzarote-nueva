#!/usr/bin/env node
/**
 * Migración COMPLETA MariaDB antigua → JSON CMS de la web nueva.
 *
 * Uso:
 *   node scripts/migrate-legacy-full.mjs /tmp/legacy-export --write
 *
 * Incluye: tours, traslados, facturas, blog, mensajes, feedback,
 * pagos online, colaboradores, redirects, banner, puertos/grupos/shore,
 * calendario de escalas Lanzarote, y (opcional) re-usa reservas ya migradas.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const dataDir = path.join(root, "src/data");

// Rutas reales en el VPS (no /uploads/tours/{id}/). Tras migrar media,
// scripts/migrate-legacy-media.mjs reescribe a Supabase Storage.
const MEDIA_TOUR_THUMB =
  "https://www.lanzaroteexperiencetours.com/uploads/excursions/thumb";
const MEDIA_TOUR_GALLERY =
  "https://www.lanzaroteexperiencetours.com/uploads/excursions/gallery";
const MEDIA_CRUISE_THUMB =
  "https://www.lanzaroteexperiencetours.com/uploads/cruise/thumb";
const MEDIA_CRUISE_TOUR =
  "https://www.lanzaroteexperiencetours.com/uploads/cruise/tours";
const MEDIA_POSTS =
  "https://www.lanzaroteexperiencetours.com/uploads/posts";

const LEGACY_TOUR_IDS = {
  1: "timanfaya-experience",
  2: "grand-tour-experience",
  3: "cesar-manrique",
  4: "delfines-atardecer",
  5: "graciosa-catamaran",
  6: "panoramica-sur-norte",
  7: "traslado-concierto-jameos",
  8: "ruta-vino",
  9: "astro-tour-experience",
  13: "senderismo-norte",
  15: "tour-privado",
  28: "mercadillo-teguise",
};

const ZONE_NAMES = {
  1: "Playa Blanca",
  2: "Playa Blanca",
  3: "Puerto del Carmen",
  4: "Costa Teguise",
  5: "Puerto Calero",
  6: "Arrecife",
  7: "La Santa",
  8: "Charco del Palo",
  9: "Haría",
  10: "Órzola",
  11: "Famara",
  12: "Yaiza",
  13: "Tias",
  14: "Playa Honda",
  15: "Puerto de Los Mármoles",
  16: "Punta Mujeres",
  17: "Pabellon de Tias",
};

const MOMENT = { 1: "morning", 2: "afternoon", 3: "evening" };

function readJson(dir, name) {
  return JSON.parse(fs.readFileSync(path.join(dir, name), "utf8"));
}

function writeData(name, data) {
  const full = path.join(dataDir, name);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, JSON.stringify(data, null, 2) + "\n");
  const size = fs.statSync(full).size;
  const count = Array.isArray(data)
    ? data.length
    : data?.calls?.length ?? data?.destinations?.length ?? data?.shoreTours?.length ?? Object.keys(data).length;
  console.log(`✓ ${name} (${count}) ${(size / 1024).toFixed(1)} KB`);
}

function stripHtml(html) {
  if (!html) return "";
  return String(html)
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#34;/g, '"')
    .replace(/&#60;/g, "<")
    .replace(/&#62;/g, ">")
    .replace(/&#38;/g, "&")
    .replace(/\r/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function listFromHtml(html) {
  if (!html) return [];
  const items = [];
  const re = /<li[^>]*>([\s\S]*?)<\/li>/gi;
  let m;
  while ((m = re.exec(html))) {
    const t = stripHtml(m[1]);
    if (t) items.push(t);
  }
  if (items.length) return items;
  return stripHtml(html)
    .split(/\n|•|·|;/)
    .map((s) => s.trim())
    .filter((s) => s.length > 2)
    .slice(0, 20);
}

function slugify(text) {
  return String(text || "item")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function num(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function parseMaybeJson(raw) {
  if (!raw) return null;
  if (typeof raw === "object") return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function splitIgic(gross, taxRate = 7) {
  const total = Math.round(Math.abs(num(gross)) * 100) / 100;
  const sign = num(gross) < 0 ? -1 : 1;
  if (!taxRate || !total) {
    return {
      subtotal: sign * total,
      taxAmount: 0,
      total: sign * total,
      taxRate,
    };
  }
  const subtotal = Math.round((total / (1 + taxRate / 100)) * 100) / 100;
  const taxAmount = Math.round((total - subtotal) * 100) / 100;
  return {
    subtotal: sign * subtotal,
    taxAmount: sign * taxAmount,
    total: sign * total,
    taxRate,
  };
}

function buildSchedule(tourId, daysRows) {
  const schedule = {};
  for (const row of daysRows.filter((d) => Number(d.tour_id) === Number(tourId))) {
    const zone = ZONE_NAMES[Number(row.zone_id)] || `Zona ${row.zone_id}`;
    const slot = MOMENT[Number(row.moment)] || "morning";
    const day = Number(row.day); // 0=Sun … 6=Sat in legacy → convert to Mon-first array?
    // New app uses arrays of 7 booleans Mon→Sun (index 0 = Monday)
    // Legacy day 0 often = Sunday in PHP date('w')
    const monIndex = day === 0 ? 6 : day - 1;
    if (!schedule[zone]) {
      schedule[zone] = {
        morning: Array(7).fill(false),
        afternoon: Array(7).fill(false),
        evening: Array(7).fill(false),
      };
    }
    if (monIndex >= 0 && monIndex < 7) schedule[zone][slot][monIndex] = true;
  }
  return schedule;
}

function migrateTours(exportDir) {
  const tours = readJson(exportDir, "tours.json");
  const trs = readJson(exportDir, "tours_translations.json");
  const media = readJson(exportDir, "tours_media.json");
  const reviews = readJson(exportDir, "tours_reviews.json");
  const days = readJson(exportDir, "tours_days.json");
  const availability = readJson(exportDir, "tours_availability.json");
  const existing = require(path.join(dataDir, "tours.json"));
  const existingById = new Map(existing.map((t) => [t.id, t]));

  const trByTour = new Map();
  for (const tr of trs) {
    const tid = Number(tr.tour_id);
    if (!trByTour.has(tid)) trByTour.set(tid, {});
    trByTour.get(tid)[tr.lang_id] = tr;
  }

  const mediaByTour = new Map();
  for (const m of media) {
    const tid = Number(m.tour_id);
    if (!mediaByTour.has(tid)) mediaByTour.set(tid, []);
    mediaByTour.get(tid).push(m);
  }

  const reviewStats = new Map();
  for (const r of reviews) {
    if (Number(r.status) !== 1) continue;
    const tid = Number(r.tour_id);
    const cur = reviewStats.get(tid) || { sum: 0, n: 0 };
    cur.sum += num(r.score);
    cur.n += 1;
    reviewStats.set(tid, cur);
  }

  const today = new Date().toISOString().slice(0, 10);
  const out = [];

  for (const t of tours) {
    const tid = Number(t.id);
    const langs = trByTour.get(tid) || {};
    const es = langs.es || Object.values(langs)[0] || {};
    const id =
      LEGACY_TOUR_IDS[tid] ||
      slugify(es.slug || es.name || t.name || `tour-${tid}`);
    const prev = existingById.get(id);

    const mediaRows = (mediaByTour.get(tid) || []).sort(
      (a, b) => num(a.priority) - num(b.priority)
    );
    const thumbs = mediaRows
      .filter((m) => String(m.type) === "0")
      .map((m) => `${MEDIA_TOUR_THUMB}/${m.url}`);
    const galleryImgs = mediaRows
      .filter((m) => String(m.type) !== "0")
      .map((m) => `${MEDIA_TOUR_GALLERY}/${tid}/${m.url}`);
    const imgs = [...thumbs, ...galleryImgs];
    const image =
      thumbs[0] ||
      galleryImgs[0] ||
      prev?.image ||
      "/images/tours/landscape-1.jpg";
    const gallery = galleryImgs.length
      ? galleryImgs
      : imgs.length
        ? imgs
        : [image];

    const stats = reviewStats.get(tid);
    const rating = stats?.n
      ? Math.round((stats.sum / stats.n) * 10) / 10
      : prev?.rating || 9;
    const reviewCount = stats?.n || prev?.reviewCount || 0;

    const schedule = buildSchedule(tid, days);
    const maxPax = num(t.max_pax) || prev?.maxGroup || 20;
    const blockedDates = availability
      .filter(
        (a) =>
          Number(a.tour_id) === tid &&
          a.date >= today &&
          num(a.filled) >= maxPax
      )
      .map((a) => ({
        date: a.date,
        language: a.lang_id || undefined,
        seats: 0,
      }));

    const isPrivate = Number(t.is_private) === 1;
    const category = isPrivate
      ? "private"
      : /minibus|privad/i.test(es.name || "")
        ? "minibus"
        : "excursion";

    const tour = {
      id,
      slug: es.slug || prev?.slug || id,
      title: es.name || t.name || prev?.title || `Tour ${tid}`,
      shortTitle:
        stripHtml(es.name || t.name || "").slice(0, 48) ||
        prev?.shortTitle ||
        `Tour ${tid}`,
      category,
      groupSize: Number(t.small_group) === 1 ? "small" : "large",
      duration: `${num(t.duration) || prev?.durationHours || 5} horas aprox.`,
      durationHours: num(t.duration) || prev?.durationHours || 5,
      priceAdult: num(t.price_ad),
      priceChild: num(t.price_ch),
      priceBaby: num(t.price_by) || undefined,
      priceAdultOffer: num(t.old_price_ad) > num(t.price_ad) ? num(t.old_price_ad) : undefined,
      priceChildOffer: num(t.old_price_ch) > num(t.price_ch) ? num(t.old_price_ch) : undefined,
      currency: "EUR",
      rating,
      reviewCount,
      image,
      gallery,
      summary: stripHtml(es.short_desc).slice(0, 400) || prev?.summary || "",
      description: stripHtml(es.large_desc) || prev?.description || "",
      highlights: listFromHtml(es.route) || (t.route ? String(t.route).split(",") : prev?.highlights || []),
      places: t.route
        ? String(t.route)
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : prev?.places || [],
      included: listFromHtml(es.included) || prev?.included || [],
      notIncluded: listFromHtml(es.not_included) || prev?.notIncluded || [],
      recommendations: listFromHtml(es.recommends) || prev?.recommendations || [],
      cancellationPolicy:
        prev?.cancellationPolicy ||
        "Cancelación gratuita hasta 24 h antes. Reembolso completo si el barco no atraca.",
      maxGroup: maxPax || undefined,
      languages: Object.keys(langs).length ? Object.keys(langs) : ["es", "en", "de"],
      allowPayOnDay: true,
      allowCard: true,
      allowBizum: true,
      cruiseFriendly: false,
      featured: Number(t.is_top) === 1,
      active: Number(t.status) === 1,
      smallGroup: Number(t.small_group) === 1,
      mixLanguages: Number(t.mix_lang) === 1,
      priority: num(t.priority),
      isPrivateActivity: isPrivate,
      youtubeUrl: t.video || undefined,
      mapUrl: t.map || undefined,
      schedule: Object.keys(schedule).length ? schedule : prev?.schedule,
      blockedDates: blockedDates.length ? blockedDates : prev?.blockedDates,
      seo: {
        title: es.seo_title || undefined,
        description: es.seo_desc || undefined,
      },
      translations: {
        ...(langs.en
          ? {
              en: {
                title: langs.en.name,
                summary: stripHtml(langs.en.short_desc).slice(0, 400),
                description: stripHtml(langs.en.large_desc),
                included: listFromHtml(langs.en.included),
                notIncluded: listFromHtml(langs.en.not_included),
                recommendations: listFromHtml(langs.en.recommends),
              },
            }
          : {}),
        ...(langs.de
          ? {
              de: {
                title: langs.de.name,
                summary: stripHtml(langs.de.short_desc).slice(0, 400),
                description: stripHtml(langs.de.large_desc),
                included: listFromHtml(langs.de.included),
                notIncluded: listFromHtml(langs.de.not_included),
                recommendations: listFromHtml(langs.de.recommends),
              },
            }
          : {}),
      },
      legacyTourId: tid,
    };
    out.push(tour);
  }

  out.sort((a, b) => (a.priority || 99) - (b.priority || 99));
  return out;
}

function migrateTransfers(exportDir) {
  const rows = readJson(exportDir, "transfers.json");
  const existing = require(path.join(dataDir, "transfers.json"));
  const bySlug = new Map(
    (existing.destinations || []).map((d) => [d.slug, d])
  );
  const destinations = rows.map((r) => {
    const slug = slugify(r.name);
    const prev = bySlug.get(slug);
    return {
      id: prev?.id || slug,
      name: r.name,
      slug,
      priceOneWay: num(r.price_ida),
      priceReturn: num(r.price_ida_vuelta),
      priceExtraPerson: num(r.extra_pax),
      duration: prev?.duration || "",
      distance: prev?.distance || "",
    };
  });
  return {
    destinations,
    highlights: existing.highlights || [
      "Conductor local",
      "Seguimiento de vuelos",
      "Pago online o el día",
    ],
  };
}

function migrateInvoices(exportDir) {
  const invoices = readJson(exportDir, "invoices.json");
  const customers = readJson(exportDir, "customers.json");
  const byCustomer = new Map(customers.map((c) => [Number(c.id), c]));
  const out = [];

  for (const inv of invoices) {
    const services = parseMaybeJson(inv.services) || {};
    const lines = Object.values(services).map((s) => {
      const qty = Math.max(1, num(s.amount, 1));
      const total = num(s.item_price);
      const unitPrice = qty ? Math.round((total / qty) * 100) / 100 : total;
      return {
        description: s.concept || "Servicio",
        qty,
        unitPrice,
        total,
      };
    });
    if (!lines.length) {
      lines.push({
        description: "Servicios",
        qty: 1,
        unitPrice: num(inv.total_amount),
        total: num(inv.total_amount),
      });
    }
    const taxRate = num(inv.tax, 7);
    const { subtotal, taxAmount, total } = splitIgic(inv.total_amount, taxRate);
    const customer = byCustomer.get(Number(inv.customer_id));
    const number = num(inv.invoice_number);
    const statusNum = Number(inv.status);
    const notes = inv.notes || undefined;
    const isCredit =
      statusNum === 2 ||
      total < 0 ||
      lines.some((l) => l.total < 0) ||
      /abono|cancelaci[oó]n/i.test(String(notes || ""));
    out.push({
      id: `FAC-${number}`,
      number,
      type: isCredit ? "credit_note" : "invoice",
      bookingId: inv.booking_id || "",
      createdAt: new Date(
        inv.create_date || inv.invoice_date || Date.now()
      ).toISOString(),
      customer: {
        name: customer?.name || "Cliente",
        email: customer?.email || "",
        phone: customer?.phone || undefined,
      },
      lines,
      subtotal,
      taxRate,
      taxAmount,
      total,
      notes,
      status: statusNum === 0 ? "void" : "issued",
      legacyHash: inv.hash,
      paymentMethod: inv.payment_method || undefined,
    });
  }

  out.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  return out;
}

function migrateBlog(exportDir) {
  const posts = readJson(exportDir, "posts.json");
  const bySlug = new Map();
  for (const p of posts) {
    if (Number(p.status) !== 1) continue;
    // Prefer Spanish; keep first of other langs as separate slugs
    const key = p.slug;
    if (p.lang_id === "es" || !bySlug.has(key)) {
      const content = stripHtml(p.content);
      bySlug.set(key, {
        slug: p.slug,
        title: p.title,
        excerpt: content.slice(0, 220) + (content.length > 220 ? "…" : ""),
        content: content || p.title,
        image: p.image
          ? `${MEDIA_POSTS}/${p.image}`
          : "/images/heroes/blog.jpg",
        date: String(p.create_date || "").slice(0, 10),
        author: "Lanzarote Experience Tours",
        tags: p.lang_id ? [p.lang_id] : [],
      });
    }
  }
  return [...bySlug.values()].sort((a, b) => (a.date < b.date ? 1 : -1));
}

function migrateMessages(exportDir) {
  return readJson(exportDir, "contacts.json")
    .map((c) => ({
      id: `MSG-${c.id}`,
      createdAt: new Date(c.create_date || Date.now()).toISOString(),
      name: c.name || "Contacto",
      email: c.email || "",
      phone: c.phone || undefined,
      message: c.message || "",
    }))
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

function migrateAdminExtras(exportDir) {
  const payments = readJson(exportDir, "payments.json");
  const feedback = readJson(exportDir, "feedback.json");
  const redirects = readJson(exportDir, "redirects.json");
  const suppliers = readJson(exportDir, "suppliers.json");
  const ports = readJson(exportDir, "cruise_ports.json");
  const groups = readJson(exportDir, "cruise_groups.json");
  const ships = readJson(exportDir, "cruise_ships.json");
  const lines = readJson(exportDir, "cruise_lines.json");
  const cruises = readJson(exportDir, "cruises.json");
  const cruiseToursTr = readJson(exportDir, "cruise_tours_translation.json");

  const shipById = new Map(ships.map((s) => [Number(s.id), s]));
  const lineById = new Map(lines.map((l) => [Number(l.id), l]));
  const cruiseMeta = new Map(
    cruises.map((c) => [
      Number(c.id),
      {
        ship: shipById.get(Number(c.ship_id))?.name || "",
        company: lineById.get(Number(c.line_id))?.name || "",
      },
    ])
  );
  const portById = new Map(ports.map((p) => [Number(p.id), p]));
  const tourTitle = new Map(
    cruiseToursTr
      .filter((t) => t.lang_id === "es")
      .map((t) => [Number(t.tour_id), t.name])
  );

  const paymentLinks = payments.map((p) => ({
    id: `pay-leg-${p.id}`,
    createdAt: new Date(p.create_date || Date.now()).toISOString(),
    locator: p.ref_code || `P-${p.id}`,
    concept: p.concept || "Pago",
    amount: num(p.amount),
    status:
      ["CF", "PA", "PP", "OK", "PAID"].includes(String(p.status).toUpperCase())
        ? "paid"
        : String(p.status).toUpperCase() === "CX"
          ? "cancelled"
          : "pending",
    customerEmail: p.email || undefined,
    customerLocale: ["es", "en", "de"].includes(p.lang_id) ? p.lang_id : "es",
    paymentHash: p.hash || undefined,
    chargeFull: true,
  }));

  const feedbackOut = feedback.map((f) => ({
    id: `fb-${f.id}`,
    createdAt: new Date(f.create_date || Date.now()).toISOString(),
    bookingId: f.booking_hash || undefined,
    ratingGeneral: Math.round(num(f.general_rate) / 10) || 0,
    ratingContent: Math.round(num(f.content_rate) / 10) || 0,
    ratingBooking: Math.round(num(f.booking_rate) / 10) || 0,
    source: f.visite_source || "",
    suggestions: f.sugg || "",
    customerName: f.customer_email || undefined,
  }));

  const redirectsOut = redirects.map((r) => ({
    id: `redir-${r.id}`,
    httpCode: Number(r.type) === 1 ? 302 : 301,
    locale: ["es", "en", "de"].includes(r.lang_id) ? r.lang_id : "es",
    fromSlug: String(r.url_from || "").replace(/^\//, ""),
    toSlug: String(r.url_to || "").replace(/^\//, ""),
  }));

  const collaborators = suppliers.map((s) => ({
    id: `col-${s.id}`,
    name: s.name || s.legal_name || `Proveedor ${s.id}`,
    type: "agency",
    active: Number(s.status) === 1,
    phone: s.phone || "",
    email: s.email || "",
    contactPerson: s.contact_name || "",
    notes: [s.legal_name, s.cif, s.city].filter(Boolean).join(" · "),
  }));

  const cruisePorts = ports
    .filter((p) => Number(p.tours) === 1 || Number(p.id) === 5)
    .map((p) => ({
      id: `port-${p.id}`,
      name: p.long_name || p.name,
      region: /madeira|funchal/i.test(p.name)
        ? "Madeira"
        : /lanzarote|mármoles|marmoles/i.test(p.name)
          ? "Lanzarote"
          : "Canarias",
      offersExcursions: Number(p.tours) === 1,
    }));

  const cruiseGroups = groups.map((g) => {
    const meta = cruiseMeta.get(Number(g.cruise_id)) || {};
    const port = portById.get(Number(g.port_id));
    const statusNum = Number(g.status);
    return {
      id: `grp-${g.id}`,
      status:
        statusNum === 2
          ? "done"
          : statusNum === 1
            ? "full"
            : Number(g.tour_type) === 1
              ? "private"
              : "open",
      shipName: meta.ship || `Crucero ${g.cruise_id}`,
      company: meta.company || "",
      date: g.call_date,
      port: port?.name || "Lanzarote",
      excursionTitle:
        tourTitle.get(Number(g.tour_id)) || `Shore #${g.tour_id}`,
      complete: Boolean(g.confirme_date) || statusNum === 2,
      minPax: num(g.min_pax) || 0,
      pax: num(g.total_pax) || 0,
      notes: `Legacy group ${g.id}`,
    };
  });

  return {
    paymentLinks,
    collaborators,
    feedback: feedbackOut,
    cruisePorts,
    cruiseGroups,
    redirects: redirectsOut,
  };
}

function migrateSettings(exportDir) {
  const existing = require(path.join(dataDir, "settings.json"));
  const banners = readJson(exportDir, "banners.json");
  const b = banners[0] || {};
  return {
    ...existing,
    bannerEs: stripHtml(b.text_es) || existing.bannerEs || "",
    bannerEn: stripHtml(b.text_en) || existing.bannerEn || "",
    bannerDe: stripHtml(b.text_de) || existing.bannerDe || "",
  };
}

function migrateCruiseCalendar(exportDir) {
  const calls = readJson(exportDir, "cruise_calls_lanz.json");
  const cruises = readJson(exportDir, "cruises.json");
  const ships = readJson(exportDir, "cruise_ships.json");
  const lines = readJson(exportDir, "cruise_lines.json");
  const shipById = new Map(ships.map((s) => [Number(s.id), s]));
  const lineById = new Map(lines.map((l) => [Number(l.id), l]));
  const cruiseById = new Map(cruises.map((c) => [Number(c.id), c]));

  const outCalls = [];
  for (const c of calls) {
    if (Number(c.at_sea) === 1 || Number(c.port_id) !== 5) continue;
    const cruise = cruiseById.get(Number(c.cruise_id));
    if (!cruise) continue;
    const ship = shipById.get(Number(cruise.ship_id));
    const line = lineById.get(Number(cruise.line_id));
    const shipName = ship?.name || "Barco";
    const company = line?.name || "Naviera";
    const shipCode = (ship?.slug || shipName).slice(0, 3).toUpperCase();
    outCalls.push({
      id: `${c.call_date}-${slugify(shipName)}-${c.cruise_id}`,
      date: c.call_date,
      port: "Puerto de Los Mármoles, Lanzarote",
      company,
      shipCode,
      shipName,
      arrivalTime: c.arrival_time || "00:00",
      departureTime: c.depart_time || "23:59",
      season: c.call_date >= "2026-09-01" ? "2026-2027" : "2025-2026",
      published: true,
    });
  }
  outCalls.sort((a, b) => a.date.localeCompare(b.date));
  return {
    season: "2025-2027",
    port: "Puerto de Los Mármoles, Lanzarote",
    source: "Importado desde web antigua (cruise_calls)",
    updatedAt: new Date().toISOString().slice(0, 10),
    calls: outCalls,
  };
}

function migrateShoreTours(exportDir) {
  const existing = require(path.join(dataDir, "cruiseItineraries.json"));
  const tours = readJson(exportDir, "cruise_tours.json");
  const trs = readJson(exportDir, "cruise_tours_translation.json");
  const ports = readJson(exportDir, "cruise_ports.json");
  const portById = new Map(ports.map((p) => [Number(p.id), p]));
  const trBy = new Map();
  for (const tr of trs) {
    const tid = Number(tr.tour_id);
    if (!trBy.has(tid)) trBy.set(tid, {});
    trBy.get(tid)[tr.lang_id] = tr;
  }

  // Activar catálogo útil en Canarias / Madeira (status legacy a veces 0)
  const FORCE_ACTIVE = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 12]);

  const shoreTours = tours.map((t) => {
    const tid = Number(t.id);
    const langs = trBy.get(tid) || {};
    const es = langs.es || {};
    const media = parseMaybeJson(t.media) || [];
    const gallery = media.map(
      (f) => `${MEDIA_CRUISE_TOUR}/${tid}/${f}`
    );
    const thumb = t.thumb_image
      ? `${MEDIA_CRUISE_THUMB}/${t.thumb_image}`
      : gallery[0] || "/images/heroes/cruise.jpg";
    return {
      id: `shore-${tid}`,
      title: stripHtml(es.name) || t.short_name || `Shore ${tid}`,
      shortTitle: t.short_name || undefined,
      summary: stripHtml(es.description).slice(0, 280),
      description: stripHtml(es.description),
      priceAdult: num(t.price_pax) || null,
      pricePerPerson: num(t.price_pax) || null,
      image: thumb,
      gallery,
      duration: `${num(t.duration) || 5} horas`,
      durationHours: num(t.duration) || 5,
      places: t.route
        ? String(t.route)
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
      highlights: t.route
        ? String(t.route)
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
      maxGroup: num(t.max_pax) || undefined,
      minPax: num(t.min_pax) || undefined,
      privatePrice: num(t.price_private) || undefined,
      privateMaxPax: num(t.max_private) || undefined,
      port: portById.get(Number(t.port_id))?.name || "Lanzarote",
      active: Number(t.status) === 1 || FORCE_ACTIVE.has(tid),
      currency: "EUR",
      allowCard: true,
      allowBizum: true,
      allowPayOnDay: true,
      translations: {
        ...(langs.en
          ? {
              en: {
                title: stripHtml(langs.en.name),
                description: stripHtml(langs.en.description),
              },
            }
          : {}),
        ...(langs.de
          ? {
              de: {
                title: stripHtml(langs.de.name),
                description: stripHtml(langs.de.description),
              },
            }
          : {}),
      },
    };
  });

  const LEGACY_ALIASES = {
    "excursion-sur-de-lanzarote-parque-nacional-de-timanfaya": "shore-1",
    "lanzarote-experience-tour-nuestra-excursion-mas-completa-para-cruceristas":
      "shore-2",
  };

  function regionKeys(port) {
    const s = String(port || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-");
    const keys = [];
    if (/lanzarote/.test(s)) keys.push("lanzarote");
    if (/tenerife/.test(s)) keys.push("tenerife");
    if (/gran-canaria|las-palmas/.test(s)) keys.push("gran-canaria");
    if (/la-palma/.test(s) && !/gran-canaria/.test(s)) keys.push("la-palma");
    if (/la-gomera|gomera/.test(s)) keys.push("la-gomera");
    if (/fuerteventura|puerto-del-rosario|rosario/.test(s))
      keys.push("fuerteventura");
    if (/madeira|funchal/.test(s)) keys.push("madeira");
    return keys;
  }

  const byRegion = new Map();
  for (const t of shoreTours) {
    if (t.active === false) continue;
    for (const k of regionKeys(t.port)) {
      if (!byRegion.has(k)) byRegion.set(k, []);
      byRegion.get(k).push(t.id);
    }
  }

  const sailings = (existing.sailings || []).map((sailing) => ({
    ...sailing,
    stops: (sailing.stops || []).map((stop) => {
      if (stop.isSeaDay) return stop;
      const mapped = (stop.tourIds || []).map(
        (id) => LEGACY_ALIASES[id] || id
      );
      const fromPort = [];
      for (const r of regionKeys(stop.port)) {
        for (const id of byRegion.get(r) || []) fromPort.push(id);
      }
      const tourIds = [
        ...new Set([
          ...mapped.filter((id) => String(id).startsWith("shore-")),
          ...fromPort,
        ]),
      ];
      return {
        ...stop,
        tourIds,
        hasTours: tourIds.length > 0,
      };
    }),
  }));

  return {
    ...existing,
    updatedAt: new Date().toISOString().slice(0, 10),
    source: `${existing.source || ""} · Shore tours importados y enlazados a escalas`.trim(),
    shoreTours,
    sailings,
  };
}

function main() {
  const args = process.argv.slice(2);
  const exportDir = args.find((a) => !a.startsWith("--")) || "/tmp/legacy-export";
  const write = args.includes("--write");

  if (!fs.existsSync(path.join(exportDir, "tours.json"))) {
    console.error(`Falta export en ${exportDir}`);
    process.exit(1);
  }

  const result = {
    tours: migrateTours(exportDir),
    transfers: migrateTransfers(exportDir),
    invoices: migrateInvoices(exportDir),
    blog: migrateBlog(exportDir),
    messages: migrateMessages(exportDir),
    adminExtras: migrateAdminExtras(exportDir),
    settings: migrateSettings(exportDir),
    cruises: migrateCruiseCalendar(exportDir),
    cruiseItineraries: migrateShoreTours(exportDir),
  };

  console.log(
    JSON.stringify(
      {
        tours: result.tours.length,
        transfers: result.transfers.destinations.length,
        invoices: result.invoices.length,
        blog: result.blog.length,
        messages: result.messages.length,
        paymentLinks: result.adminExtras.paymentLinks.length,
        feedback: result.adminExtras.feedback.length,
        redirects: result.adminExtras.redirects.length,
        collaborators: result.adminExtras.collaborators.length,
        cruisePorts: result.adminExtras.cruisePorts.length,
        cruiseGroups: result.adminExtras.cruiseGroups.length,
        cruiseCalls: result.cruises.calls.length,
        shoreTours: result.cruiseItineraries.shoreTours.length,
      },
      null,
      2
    )
  );

  if (!write) {
    console.log("Dry-run. Pasa --write para guardar en src/data/");
    return;
  }

  writeData("tours.json", result.tours);
  writeData("transfers.json", result.transfers);
  writeData("invoices.json", result.invoices);
  writeData("blog.json", result.blog);
  writeData("messages.json", result.messages);
  writeData("adminExtras.json", result.adminExtras);
  writeData("settings.json", result.settings);
  writeData("cruises.json", result.cruises);
  writeData("cruiseItineraries.json", result.cruiseItineraries);

  // Bookings: keep already migrated file if present & large
  const bookingsPath = path.join(dataDir, "bookings.json");
  const bookings = JSON.parse(fs.readFileSync(bookingsPath, "utf8"));
  console.log(`✓ bookings.json conservado (${bookings.length})`);
}

main();
