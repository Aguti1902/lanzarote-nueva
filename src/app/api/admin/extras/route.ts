import { NextResponse } from "next/server";
import {
  deleteCollaborator,
  deleteCruiseGroup,
  deleteCruisePort,
  deleteFeedback,
  deletePaymentLink,
  deleteRedirect,
  getCollaborators,
  getCruiseGroups,
  getCruisePorts,
  getFeedback,
  getPaymentLinks,
  getRedirects,
  upsertCollaborator,
  upsertCruiseGroup,
  upsertCruisePort,
  upsertFeedback,
  upsertPaymentLink,
  upsertRedirect,
} from "@/lib/admin-extras";

export const dynamic = "force-dynamic";

type Resource =
  | "payments"
  | "collaborators"
  | "feedback"
  | "ports"
  | "groups"
  | "redirects";

function resourceFromUrl(request: Request): Resource | null {
  const { searchParams } = new URL(request.url);
  const r = searchParams.get("resource");
  if (
    r === "payments" ||
    r === "collaborators" ||
    r === "feedback" ||
    r === "ports" ||
    r === "groups" ||
    r === "redirects"
  ) {
    return r;
  }
  return null;
}

export async function GET(request: Request) {
  const resource = resourceFromUrl(request);
  if (!resource) {
    return NextResponse.json({ error: "Recurso inválido" }, { status: 400 });
  }
  switch (resource) {
    case "payments":
      return NextResponse.json({ items: await getPaymentLinks() });
    case "collaborators":
      return NextResponse.json({ items: await getCollaborators() });
    case "feedback":
      return NextResponse.json({ items: await getFeedback() });
    case "ports":
      return NextResponse.json({ items: await getCruisePorts() });
    case "groups":
      return NextResponse.json({ items: await getCruiseGroups() });
    case "redirects":
      return NextResponse.json({ items: await getRedirects() });
  }
}

export async function POST(request: Request) {
  try {
    const resource = resourceFromUrl(request);
    if (!resource) {
      return NextResponse.json({ error: "Recurso inválido" }, { status: 400 });
    }
    const body = await request.json();
    let item;
    switch (resource) {
      case "payments":
        item = await upsertPaymentLink(body);
        break;
      case "collaborators":
        item = await upsertCollaborator(body);
        break;
      case "feedback":
        item = await upsertFeedback(body);
        break;
      case "ports":
        item = await upsertCruisePort(body);
        break;
      case "groups":
        item = await upsertCruiseGroup(body);
        break;
      case "redirects":
        item = await upsertRedirect(body);
        break;
    }
    return NextResponse.json({ item }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "No se pudo crear" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const resource = resourceFromUrl(request);
    if (!resource) {
      return NextResponse.json({ error: "Recurso inválido" }, { status: 400 });
    }
    const body = await request.json();
    if (!body.id) {
      return NextResponse.json({ error: "Falta id" }, { status: 400 });
    }
    let item;
    switch (resource) {
      case "payments":
        item = await upsertPaymentLink(body);
        break;
      case "collaborators":
        item = await upsertCollaborator(body);
        break;
      case "feedback":
        item = await upsertFeedback(body);
        break;
      case "ports":
        item = await upsertCruisePort(body);
        break;
      case "groups":
        item = await upsertCruiseGroup(body);
        break;
      case "redirects":
        item = await upsertRedirect(body);
        break;
    }
    return NextResponse.json({ item });
  } catch {
    return NextResponse.json({ error: "No se pudo guardar" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const resource = resourceFromUrl(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!resource || !id) {
      return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
    }
    let ok = false;
    switch (resource) {
      case "payments":
        ok = await deletePaymentLink(id);
        break;
      case "collaborators":
        ok = await deleteCollaborator(id);
        break;
      case "feedback":
        ok = await deleteFeedback(id);
        break;
      case "ports":
        ok = await deleteCruisePort(id);
        break;
      case "groups":
        ok = await deleteCruiseGroup(id);
        break;
      case "redirects":
        ok = await deleteRedirect(id);
        break;
    }
    if (!ok) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "No se pudo eliminar" }, { status: 500 });
  }
}
