import { NextResponse } from "next/server";
import {
  clearCruiseItinerariesCache,
  getCruiseCompanies,
  getCruiseItinerariesData,
  getCruiseShoreTours,
} from "@/lib/cruise-itineraries";
import { promises as fs } from "fs";
import path from "path";
import type { CruiseCompany, CruiseItinerariesData, CruiseShoreTour } from "@/types";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";

const dataPath = path.join(process.cwd(), "src/data/cruiseItineraries.json");

async function replaceSupabaseRows(
  table: string,
  key: string,
  rows: Array<Record<string, unknown>>
) {
  const sb = getSupabaseAdmin();
  if (rows.length) {
    const { error } = await sb.from(table).upsert(rows);
    if (error) throw new Error(error.message);
  }
  const { data: existing, error: readError } = await sb.from(table).select(key);
  if (readError) throw new Error(readError.message);
  const keep = new Set(rows.map((row) => String(row[key])));
  const existingRows = (existing || []) as unknown as Array<
    Record<string, unknown>
  >;
  const removed = existingRows
    .map((row) => String(row[key]))
    .filter((id) => !keep.has(id));
  if (removed.length) {
    const { error } = await sb.from(table).delete().in(key, removed);
    if (error) throw new Error(error.message);
  }
}

async function save(data: CruiseItinerariesData) {
  if (isSupabaseConfigured()) {
    await replaceSupabaseRows(
      "cruise_companies",
      "slug",
      data.companies.map((company) => ({
        slug: company.slug,
        name: company.name,
        sailing_count: company.sailingCount,
        ships: company.ships,
      }))
    );
    await replaceSupabaseRows(
      "cruise_shore_tours",
      "id",
      data.shoreTours.map((tour) => ({ id: tour.id, data: tour }))
    );
  } else {
    await fs.writeFile(dataPath, JSON.stringify(data, null, 2) + "\n", "utf-8");
  }
  clearCruiseItinerariesCache();
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const kind = searchParams.get("kind") || "companies";
  if (kind === "shore-tours") {
    return NextResponse.json({ items: await getCruiseShoreTours() });
  }
  return NextResponse.json({ items: await getCruiseCompanies() });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const kind = body.kind || "companies";
    const data = await getCruiseItinerariesData();

    if (kind === "companies") {
      const slug = String(body.slug || "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
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
      };
      data.companies.push(company);
      data.companies.sort((a, b) => a.name.localeCompare(b.name));
      await save(data);
      return NextResponse.json({ item: company }, { status: 201 });
    }

    if (kind === "shore-tours") {
      if (!body.id || !body.title) {
        return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
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
        duration: body.duration || "",
        places: body.places || [],
        highlights: body.highlights || [],
        included: body.included || [],
        notIncluded: body.notIncluded || [],
        bookingSlug: body.bookingSlug || "",
        maxGroup: Number(body.maxGroup) || 14,
        currency: "EUR",
        allowCard: true,
        allowBizum: true,
        allowPayOnDay: true,
        cancellationPolicy:
          body.cancellationPolicy ||
          "Cancelación gratuita hasta 48 horas antes.",
      };
      data.shoreTours.push(tour);
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
      data.companies[idx] = {
        ...data.companies[idx],
        name: body.name || data.companies[idx].name,
        ships: body.ships || data.companies[idx].ships,
      };
      await save(data);
      return NextResponse.json({ item: data.companies[idx] });
    }

    if (kind === "shore-tours") {
      const idx = data.shoreTours.findIndex((t) => t.id === body.id);
      if (idx < 0) {
        return NextResponse.json({ error: "No encontrado" }, { status: 404 });
      }
      data.shoreTours[idx] = { ...data.shoreTours[idx], ...body };
      await save(data);
      return NextResponse.json({ item: data.shoreTours[idx] });
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
