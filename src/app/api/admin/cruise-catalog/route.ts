import { NextResponse } from "next/server";
import {
  clearCruiseItinerariesCache,
  getCruiseCompanies,
  getCruiseItinerariesData,
  getCruiseShoreTours,
} from "@/lib/cruise-itineraries";
import { promises as fs } from "fs";
import path from "path";
import type {
  CruiseCompany,
  CruiseCompanyShip,
  CruiseItinerariesData,
  CruiseItineraryStop,
  CruiseSailing,
  CruiseShoreTour,
} from "@/types";
import { syncShoreTourStructuredFields } from "@/lib/shore-tour-display";

export const dynamic = "force-dynamic";

const dataPath = path.join(process.cwd(), "src/data/cruiseItineraries.json");

async function save(data: CruiseItinerariesData) {
  data.updatedAt = new Date().toISOString().slice(0, 10);
  await fs.writeFile(dataPath, JSON.stringify(data, null, 2) + "\n", "utf-8");
  clearCruiseItinerariesCache();
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function nightsBetween(start: string, end: string): number {
  const a = new Date(`${start}T12:00:00Z`).getTime();
  const b = new Date(`${end}T12:00:00Z`).getTime();
  if (!Number.isFinite(a) || !Number.isFinite(b) || b < a) return 0;
  return Math.round((b - a) / 86400000);
}

function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function formatSailingId(departureDate: string): string {
  const [y, m, day] = departureDate.split("-");
  const suffix = String(Math.floor(Math.random() * 9000) + 1000);
  return `${day}${m}${y}-${suffix}`;
}

function syncCompanySailingCounts(data: CruiseItinerariesData) {
  for (const company of data.companies) {
    company.sailingCount = data.sailings.filter(
      (s) => s.companySlug === company.slug
    ).length;
  }
}

function emptyStop(day: number, date: string): CruiseItineraryStop {
  return {
    day,
    date,
    port: "Navegando",
    portKey: "at-sea",
    time: "",
    arrivalTime: "",
    departureTime: "",
    isSeaDay: true,
    hasTours: false,
    tourIds: [],
  };
}

function buildStopsFromDates(
  departureDate: string,
  endDate: string
): CruiseItineraryStop[] {
  const nights = nightsBetween(departureDate, endDate);
  const stops: CruiseItineraryStop[] = [];
  for (let i = 0; i <= nights; i++) {
    stops.push(emptyStop(i + 1, addDays(departureDate, i)));
  }
  if (stops.length === 0) {
    stops.push(emptyStop(1, departureDate));
  }
  return stops;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const kind = searchParams.get("kind") || "companies";
  const companySlug = searchParams.get("company");
  const shipSlug = searchParams.get("ship");
  const sailingId = searchParams.get("sailing");

  if (kind === "shore-tours") {
    return NextResponse.json({ items: await getCruiseShoreTours() });
  }

  if (kind === "sailings") {
    const data = await getCruiseItinerariesData();
    let items = data.sailings;
    if (companySlug) {
      items = items.filter((s) => s.companySlug === companySlug);
    }
    if (shipSlug) {
      items = items.filter((s) => s.shipSlug === shipSlug);
    }
    if (sailingId) {
      items = items.filter((s) => s.id === sailingId);
    }
    items = [...items].sort((a, b) =>
      a.departureDate.localeCompare(b.departureDate)
    );
    return NextResponse.json({ items });
  }

  if (kind === "company" && companySlug) {
    const companies = await getCruiseCompanies();
    const company = companies.find((c) => c.slug === companySlug);
    if (!company) {
      return NextResponse.json({ error: "No encontrada" }, { status: 404 });
    }
    const data = await getCruiseItinerariesData();
    const sailings = data.sailings.filter((s) => s.companySlug === companySlug);
    return NextResponse.json({ item: company, sailings });
  }

  return NextResponse.json({ items: await getCruiseCompanies() });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const kind = body.kind || "companies";
    const data = await getCruiseItinerariesData();

    if (kind === "companies") {
      const slug = slugify(String(body.slug || body.name || ""));
      if (!slug || !body.name) {
        return NextResponse.json(
          { error: "Faltan nombre o slug" },
          { status: 400 }
        );
      }
      if (data.companies.some((c) => c.slug === slug)) {
        return NextResponse.json({ error: "Ya existe" }, { status: 409 });
      }
      const company: CruiseCompany = {
        slug,
        name: body.name,
        sailingCount: 0,
        ships: [],
        active: body.active !== false,
      };
      data.companies.push(company);
      data.companies.sort((a, b) => a.name.localeCompare(b.name));
      await save(data);
      return NextResponse.json({ item: company }, { status: 201 });
    }

    if (kind === "ships") {
      const company = data.companies.find((c) => c.slug === body.companySlug);
      if (!company) {
        return NextResponse.json(
          { error: "Compañía no encontrada" },
          { status: 404 }
        );
      }
      const name = String(body.name || "").trim();
      if (!name) {
        return NextResponse.json({ error: "Falta nombre" }, { status: 400 });
      }
      const slug = slugify(body.slug || name);
      if (company.ships.some((s) => s.slug === slug)) {
        return NextResponse.json({ error: "El barco ya existe" }, { status: 409 });
      }
      const ship: CruiseCompanyShip = {
        slug,
        name,
        active: body.active !== false,
      };
      company.ships.push(ship);
      company.ships.sort((a, b) => a.name.localeCompare(b.name));
      await save(data);
      return NextResponse.json({ item: ship, company }, { status: 201 });
    }

    if (kind === "sailings") {
      const company = data.companies.find((c) => c.slug === body.companySlug);
      if (!company) {
        return NextResponse.json(
          { error: "Compañía no encontrada" },
          { status: 404 }
        );
      }
      const ship = company.ships.find((s) => s.slug === body.shipSlug);
      if (!ship) {
        return NextResponse.json(
          { error: "Barco no encontrado" },
          { status: 404 }
        );
      }
      const departureDate = String(body.departureDate || "");
      if (!/^\d{4}-\d{2}-\d{2}$/.test(departureDate)) {
        return NextResponse.json(
          { error: "Fecha de salida inválida" },
          { status: 400 }
        );
      }
      const endDate =
        String(body.endDate || "") ||
        (body.nights != null
          ? addDays(departureDate, Number(body.nights))
          : departureDate);
      const nights =
        body.nights != null
          ? Number(body.nights)
          : nightsBetween(departureDate, endDate);
      let id = String(body.id || formatSailingId(departureDate));
      while (data.sailings.some((s) => s.id === id)) {
        id = formatSailingId(departureDate);
      }
      const sailing: CruiseSailing = {
        id,
        companySlug: company.slug,
        companyName: company.name,
        shipSlug: ship.slug,
        shipName: ship.name,
        departureDate,
        endDate,
        nights,
        active: body.active !== false,
        stops:
          Array.isArray(body.stops) && body.stops.length
            ? body.stops
            : buildStopsFromDates(departureDate, endDate),
      };
      data.sailings.push(sailing);
      syncCompanySailingCounts(data);
      await save(data);
      return NextResponse.json({ item: sailing }, { status: 201 });
    }

    if (kind === "shore-tours") {
      if (!body.id || !body.title) {
        return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
      }
      if (data.shoreTours.some((t) => t.id === body.id)) {
        return NextResponse.json({ error: "Ya existe" }, { status: 409 });
      }
      const tour: CruiseShoreTour = {
        id: body.id,
        title: body.title,
        shortTitle: body.shortTitle || body.title,
        summary: body.summary || "",
        description: body.description || "",
        priceAdult: Number(body.priceAdult) || 0,
        priceChild: Number(body.priceChild ?? body.priceAdult) || 0,
        pricePerPerson: Number(body.pricePerPerson ?? body.priceAdult) || 0,
        image: body.image || "/images/tours/timanfaya.jpg",
        gallery: body.gallery || (body.image ? [body.image] : []),
        duration: body.duration || "",
        durationHours: Number(body.durationHours) || undefined,
        places: body.places || [],
        highlights: body.highlights || [],
        included: body.included || [],
        notIncluded: body.notIncluded || [],
        recommendations: body.recommendations || [],
        bookingSlug: body.bookingSlug || "",
        maxGroup: Number(body.maxGroup) || 14,
        minPax: Number(body.minPax) || 8,
        privatePrice: Number(body.privatePrice) || 0,
        privateMaxPax: Number(body.privateMaxPax) || 0,
        port: body.port || "Lanzarote",
        active: body.active !== false,
        currency: "EUR",
        allowCard: body.allowCard !== false,
        allowBizum: body.allowBizum !== false,
        allowPayOnDay: body.allowPayOnDay !== false,
        cancellationPolicy:
          body.cancellationPolicy ||
          "Cancelación gratuita hasta 48 horas antes.",
        youtubeUrl: body.youtubeUrl || "",
        mapUrl: body.mapUrl || "",
        schedule: body.schedule || undefined,
        blockedDates: body.blockedDates || [],
        seo: body.seo || { title: "", description: "", keywords: "" },
        translations: body.translations || {},
      };
      data.shoreTours.push(
        syncShoreTourStructuredFields(tour) as CruiseShoreTour
      );
      await save(data);
      return NextResponse.json({ item: tour }, { status: 201 });
    }

    return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "No se pudo crear" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const kind = body.kind || "companies";
    const data = await getCruiseItinerariesData();

    if (kind === "companies") {
      const idx = data.companies.findIndex((c) => c.slug === body.slug);
      if (idx < 0) {
        return NextResponse.json({ error: "No encontrado" }, { status: 404 });
      }
      const prev = data.companies[idx];
      const nextName = body.name || prev.name;
      data.companies[idx] = {
        ...prev,
        name: nextName,
        active: body.active !== undefined ? Boolean(body.active) : prev.active,
        ships: Array.isArray(body.ships) ? body.ships : prev.ships,
      };
      if (nextName !== prev.name) {
        for (const sailing of data.sailings) {
          if (sailing.companySlug === prev.slug) {
            sailing.companyName = nextName;
          }
        }
      }
      await save(data);
      return NextResponse.json({ item: data.companies[idx] });
    }

    if (kind === "ships") {
      const company = data.companies.find((c) => c.slug === body.companySlug);
      if (!company) {
        return NextResponse.json(
          { error: "Compañía no encontrada" },
          { status: 404 }
        );
      }
      const shipIdx = company.ships.findIndex((s) => s.slug === body.slug);
      if (shipIdx < 0) {
        return NextResponse.json({ error: "Barco no encontrado" }, { status: 404 });
      }
      const prev = company.ships[shipIdx];
      const nextName = body.name || prev.name;
      company.ships[shipIdx] = {
        ...prev,
        name: nextName,
        active: body.active !== undefined ? Boolean(body.active) : prev.active,
      };
      if (nextName !== prev.name) {
        for (const sailing of data.sailings) {
          if (
            sailing.companySlug === company.slug &&
            sailing.shipSlug === prev.slug
          ) {
            sailing.shipName = nextName;
          }
        }
      }
      await save(data);
      return NextResponse.json({ item: company.ships[shipIdx], company });
    }

    if (kind === "sailings") {
      const idx = data.sailings.findIndex((s) => s.id === body.id);
      if (idx < 0) {
        return NextResponse.json(
          { error: "Crucero no encontrado" },
          { status: 404 }
        );
      }
      const prev = data.sailings[idx];
      const departureDate = body.departureDate || prev.departureDate;
      const endDate =
        body.endDate ||
        prev.endDate ||
        (prev.nights != null
          ? addDays(departureDate, prev.nights)
          : departureDate);
      const nights =
        body.nights != null
          ? Number(body.nights)
          : nightsBetween(departureDate, endDate);

      let companySlug = body.companySlug || prev.companySlug;
      let shipSlug = body.shipSlug || prev.shipSlug;
      let company = data.companies.find((c) => c.slug === companySlug);
      let ship = company?.ships.find((s) => s.slug === shipSlug);
      if (!company || !ship) {
        companySlug = prev.companySlug;
        shipSlug = prev.shipSlug;
        company = data.companies.find((c) => c.slug === companySlug);
        ship = company?.ships.find((s) => s.slug === shipSlug);
      }

      data.sailings[idx] = {
        ...prev,
        companySlug,
        companyName: company?.name || prev.companyName,
        shipSlug,
        shipName: ship?.name || prev.shipName,
        departureDate,
        endDate,
        nights,
        active:
          body.active !== undefined ? Boolean(body.active) : prev.active !== false,
        stops: Array.isArray(body.stops) ? body.stops : prev.stops,
      };
      syncCompanySailingCounts(data);
      await save(data);
      return NextResponse.json({ item: data.sailings[idx] });
    }

    if (kind === "shore-tours") {
      const idx = data.shoreTours.findIndex((t) => t.id === body.id);
      if (idx < 0) {
        return NextResponse.json({ error: "No encontrado" }, { status: 404 });
      }
      const { kind: _kind, ...rest } = body;
      data.shoreTours[idx] = syncShoreTourStructuredFields({
        ...data.shoreTours[idx],
        ...rest,
      }) as CruiseShoreTour;
      await save(data);
      return NextResponse.json({ item: data.shoreTours[idx] });
    }

    if (kind === "duplicate-sailing") {
      const source = data.sailings.find((s) => s.id === body.id);
      if (!source) {
        return NextResponse.json({ error: "No encontrado" }, { status: 404 });
      }
      let id = formatSailingId(source.departureDate);
      while (data.sailings.some((s) => s.id === id)) {
        id = formatSailingId(source.departureDate);
      }
      const copy: CruiseSailing = {
        ...JSON.parse(JSON.stringify(source)),
        id,
      };
      data.sailings.push(copy);
      syncCompanySailingCounts(data);
      await save(data);
      return NextResponse.json({ item: copy }, { status: 201 });
    }

    return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "No se pudo guardar" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const kind = searchParams.get("kind") || "companies";
    const id = searchParams.get("id");
    const companySlug = searchParams.get("company");
    if (!id) {
      return NextResponse.json({ error: "Falta id" }, { status: 400 });
    }
    const data = await getCruiseItinerariesData();

    if (kind === "companies") {
      const next = data.companies.filter((c) => c.slug !== id);
      if (next.length === data.companies.length) {
        return NextResponse.json({ error: "No encontrado" }, { status: 404 });
      }
      data.companies = next;
      data.sailings = data.sailings.filter((s) => s.companySlug !== id);
      await save(data);
      return NextResponse.json({ ok: true });
    }

    if (kind === "ships") {
      if (!companySlug) {
        return NextResponse.json({ error: "Falta company" }, { status: 400 });
      }
      const company = data.companies.find((c) => c.slug === companySlug);
      if (!company) {
        return NextResponse.json(
          { error: "Compañía no encontrada" },
          { status: 404 }
        );
      }
      const before = company.ships.length;
      company.ships = company.ships.filter((s) => s.slug !== id);
      if (company.ships.length === before) {
        return NextResponse.json({ error: "No encontrado" }, { status: 404 });
      }
      data.sailings = data.sailings.filter(
        (s) => !(s.companySlug === companySlug && s.shipSlug === id)
      );
      syncCompanySailingCounts(data);
      await save(data);
      return NextResponse.json({ ok: true });
    }

    if (kind === "sailings") {
      const before = data.sailings.length;
      data.sailings = data.sailings.filter((s) => s.id !== id);
      if (data.sailings.length === before) {
        return NextResponse.json({ error: "No encontrado" }, { status: 404 });
      }
      syncCompanySailingCounts(data);
      await save(data);
      return NextResponse.json({ ok: true });
    }

    if (kind === "shore-tours") {
      const next = data.shoreTours.filter((t) => t.id !== id);
      if (next.length === data.shoreTours.length) {
        return NextResponse.json({ error: "No encontrado" }, { status: 404 });
      }
      data.shoreTours = next;
      await save(data);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "No se pudo eliminar" }, { status: 500 });
  }
}
