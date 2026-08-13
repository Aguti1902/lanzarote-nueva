/**
 * Importa navieras, salidas e itinerarios públicos desde
 * lanzaroteexperiencetours.com hacia src/data/cruiseItineraries.json
 *
 * Uso: node scripts/import-cruise-itineraries.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const BASE = "https://www.lanzaroteexperiencetours.com";
const OUT = path.join(ROOT, "src/data/cruiseItineraries.json");
const IMG_DIR = path.join(ROOT, "public/images/tours/cruise");

const COMPANY_NAMES = {
  "aida-cruises": "AIDA Cruises",
  "ambassador-cruise-line": "Ambassador Cruise Line",
  "celebrity-cruises": "Celebrity Cruises",
  "cfc-croisieres": "CFC Croisières",
  "costa-cruises": "Costa Cruceros",
  "crystal-cruises": "Crystal Cruises",
  "cunard-line-cruises": "Cunard",
  "fred-olsen-cruise-lines": "Fred. Olsen Cruise Lines",
  "hapag-lloyd": "Hapag-Lloyd",
  hollandamericaline: "Holland America Line",
  "marella-cruises": "Marella Cruises",
  "msc-cruises": "MSC Cruceros",
  "norwegian-cruise-line-ncl": "Norwegian Cruise Line",
  "phoenix-reisen": "Phoenix Reisen",
  "po-cruises": "P&O Cruises",
  "princess-cruises": "Princess Cruises",
  "regent-seven-seas-cruises": "Regent Seven Seas Cruises",
  "saga-cruises": "Saga Cruises",
  silversea: "Silversea",
  "star-clippers": "Star Clippers",
  "tui-cruises": "TUI Cruises",
  "windstar-cruises": "Windstar Cruises",
};

const BOOKING = {
  "excursion-sur-de-lanzarote-parque-nacional-de-timanfaya":
    "excursion-timanfaya-montanas-del-fuego",
  "lanzarote-experience-tour-nuestra-excursion-mas-completa-para-cruceristas":
    "excursion-grand-tour-experience",
};

const UA = { "User-Agent": "Mozilla/5.0 (compatible; LET-data-import/1.0)" };

function slugify(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function clean(t) {
  return String(t || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseDateEs(d) {
  const m = d.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : d;
}

function parsePrice(p) {
  const m = clean(p)
    .replace("€", "")
    .replace(",", ".")
    .match(/(\d+(?:\.\d+)?)/);
  return m ? Number(m[1]) : null;
}

async function get(url) {
  const res = await fetch(url, { headers: UA });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.text();
}

async function main() {
  const indexHtml = await get(`${BASE}/excursiones-cruceros/`);
  const companies = [
    ...new Set(
      [...indexHtml.matchAll(/\/excursiones-cruceros\/([a-z0-9\-]+)\//g)].map(
        (m) => m[1]
      )
    ),
  ].sort();

  const sailingMeta = [];
  for (const slug of companies) {
    const html = await get(`${BASE}/excursiones-cruceros/${slug}/`);
    const found = [
      ...html.matchAll(
        /\/crucero\/([a-z0-9\-]+)\/([a-z0-9\-]+)\/(\d{8}-\d+)\//g
      ),
    ];
    const uniq = new Map();
    for (const m of found) uniq.set(m[0], m);
    console.log(`${slug}: ${uniq.size} sailings`);
    for (const m of uniq.values()) {
      const d = m[3].split("-")[0];
      sailingMeta.push({
        companySlug: m[1],
        shipSlug: m[2],
        sailingId: m[3],
        departureDate:
          d.length === 8 ? `${d.slice(4)}-${d.slice(2, 4)}-${d.slice(0, 2)}` : "",
        path: m[0],
      });
    }
  }

  const toursById = {};
  const sailings = [];
  let i = 0;
  for (const s of sailingMeta) {
    i += 1;
    const html = await get(`${BASE}${s.path}`);
    const h1 = clean((html.match(/<h1[^>]*>(.*?)<\/h1>/is) || [])[1] || "");
    let nights = null;
    const nm = h1.match(/(\d+)\s*noches/i);
    if (nm) nights = Number(nm[1]);
    let ship = s.shipSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    let company = COMPANY_NAMES[s.companySlug] || s.companySlug;
    const sm = h1.match(/Excursiones\s+(.+?)\s*\((.+?)\)\s*con salida/i);
    if (sm) {
      ship = clean(sm[1]);
      company = clean(sm[2]);
    }
    let dep = s.departureDate;
    const dm = h1.match(/con salida el\s+(\d{2}\/\d{2}\/\d{4})/i);
    if (dm) dep = parseDateEs(dm[1]);

    const blocks = [
      ...html.matchAll(
        /<article class="(cruise__call|cruise__sea)">(.*?)<\/article>/gs
      ),
    ];
    const stops = [];
    let day = 0;
    for (const [, kind, art] of blocks) {
      day += 1;
      if (kind === "cruise__sea") {
        const dateM = art.match(/D[ií]a:\s*(\d{2}\/\d{2}\/\d{4})/i);
        const portM = art.match(/cruise__call-atsea">(.*?)<\/h2>/s);
        stops.push({
          day,
          date: dateM ? parseDateEs(dateM[1]) : null,
          port: clean(portM?.[1] || "Navegando"),
          portKey: "at-sea",
          time: "",
          isSeaDay: true,
          hasTours: false,
          tourIds: [],
        });
        continue;
      }
      const dateM = art.match(/D[ií]a de escala:\s*(\d{2}\/\d{2}\/\d{4})/i);
      const portM = art.match(/cruise__call-portname">(.*?)<\/h2>/s);
      const timeM = art.match(/cruise__call-time">(.*?)<\/p>/s);
      const port = clean(portM?.[1] || "");
      const tourIds = [];
      if (!art.includes("cruise__call-notours")) {
        for (const blockM of art.matchAll(
          /<div class="cruise__tour js-tour">(.*?)(?:<div class="cruise__book|$)/gs
        )) {
          const block = blockM[1];
          const name = clean(
            (block.match(/cruise__tour-name">(.*?)<\/h3>/s) || [])[1] || ""
          );
          if (!name) continue;
          const tid = slugify(name);
          const img = (block.match(/src="([^"]+)"/) || [])[1] || "";
          const price = parsePrice(
            (block.match(/cruise__tour-price[^>]*>(.*?)</s) || [])[1] || ""
          );
          const items = [...block.matchAll(/<li>(.*?)<\/li>/gs)].map((x) =>
            clean(x[1])
          );
          let duration = "";
          const places = [];
          const highlights = [];
          for (const it of items) {
            const low = it.toLowerCase();
            if (low.startsWith("duración del tour") || low.startsWith("duracion del tour")) {
              duration = it.split(":").slice(1).join(":").trim();
            } else if (low.startsWith("lugares a visitar")) {
              places.push(
                ...it
                  .split(":")
                  .slice(1)
                  .join(":")
                  .split(",")
                  .map((p) => p.trim())
                  .filter(Boolean)
              );
            } else if (it && it.length < 120) {
              highlights.push(it);
            }
          }
          toursById[tid] = {
            id: tid,
            title: name,
            priceAdult: price,
            image: img,
            duration,
            places,
            highlights: highlights.slice(0, 6),
            bookingSlug: BOOKING[tid],
            maxGroup: 25,
            currency: "EUR",
          };
          tourIds.push(tid);
        }
      }
      stops.push({
        day,
        date: dateM ? parseDateEs(dateM[1]) : null,
        port,
        portKey: slugify(port),
        time: clean(timeM?.[1] || ""),
        isSeaDay: false,
        hasTours: tourIds.length > 0,
        tourIds,
      });
    }

    sailings.push({
      id: s.sailingId,
      companySlug: s.companySlug,
      companyName: company,
      shipSlug: s.shipSlug,
      shipName: ship,
      departureDate: dep,
      nights,
      stops,
    });
    if (i % 25 === 0) console.log(`${i}/${sailingMeta.length}`);
  }

  fs.mkdirSync(IMG_DIR, { recursive: true });
  for (const tour of Object.values(toursById)) {
    if (!tour.image) continue;
    const ext = tour.image.split(".").pop().split("?")[0] || "jpg";
    const fname = `${tour.id}.${ext}`;
    const dest = path.join(IMG_DIR, fname);
    if (!fs.existsSync(dest)) {
      const res = await fetch(tour.image, { headers: UA });
      if (res.ok) {
        fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
        console.log("image", fname);
      }
    }
    tour.image = `/images/tours/cruise/${fname}`;
  }

  const compMap = new Map();
  for (const s of sailings) {
    if (!compMap.has(s.companySlug)) {
      compMap.set(s.companySlug, {
        slug: s.companySlug,
        name: s.companyName,
        sailingCount: 0,
        ships: new Map(),
      });
    }
    const c = compMap.get(s.companySlug);
    c.sailingCount += 1;
    c.ships.set(s.shipSlug, s.shipName);
    c.name = s.companyName;
  }

  const companiesOut = [...compMap.values()]
    .map((c) => ({
      slug: c.slug,
      name: c.name,
      sailingCount: c.sailingCount,
      ships: [...c.ships.entries()]
        .map(([slug, name]) => ({ slug, name }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  sailings.sort((a, b) =>
    `${a.departureDate}${a.companySlug}${a.shipSlug}${a.id}`.localeCompare(
      `${b.departureDate}${b.companySlug}${b.shipSlug}${b.id}`
    )
  );

  const data = {
    updatedAt: new Date().toISOString().slice(0, 10),
    source:
      "Importado desde itinerarios públicos de lanzaroteexperiencetours.com",
    companies: companiesOut,
    shoreTours: Object.values(toursById),
    sailings,
  };
  fs.writeFileSync(OUT, JSON.stringify(data, null, 2) + "\n");
  console.log(
    `Wrote ${OUT} · companies ${companiesOut.length} · sailings ${sailings.length} · tours ${data.shoreTours.length}`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
