import type {
  Collaborator,
  CruiseGroup,
  CruisePort,
  CustomerFeedback,
  PaymentLink,
  SeoRedirect,
} from "@/types";
import { readCmsJson, writeCmsJson } from "@/lib/supabase/cms-store";

export type AdminExtrasData = {
  paymentLinks: PaymentLink[];
  collaborators: Collaborator[];
  feedback: CustomerFeedback[];
  cruisePorts: CruisePort[];
  cruiseGroups: CruiseGroup[];
  redirects: SeoRedirect[];
};

const empty: AdminExtrasData = {
  paymentLinks: [],
  collaborators: [],
  feedback: [],
  cruisePorts: [],
  cruiseGroups: [],
  redirects: [],
};

async function readData(): Promise<AdminExtrasData> {
  try {
    const stored = await readCmsJson<Partial<AdminExtrasData>>(
      "adminExtras.json"
    );
    return { ...empty, ...stored };
  } catch {
    return empty;
  }
}

async function writeData(data: AdminExtrasData): Promise<void> {
  await writeCmsJson("adminExtras.json", data);
}

function uid(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 6)}`;
}

/* ── Payment links ── */
export async function getPaymentLinks() {
  return (await readData()).paymentLinks;
}

export async function upsertPaymentLink(
  input: Partial<PaymentLink> & Pick<PaymentLink, "concept" | "amount">
) {
  const data = await readData();
  if (input.id) {
    const idx = data.paymentLinks.findIndex((p) => p.id === input.id);
    if (idx >= 0) {
      data.paymentLinks[idx] = { ...data.paymentLinks[idx], ...input } as PaymentLink;
      await writeData(data);
      return data.paymentLinks[idx];
    }
  }
  const created: PaymentLink = {
    id: uid("pay"),
    createdAt: new Date().toISOString(),
    locator: input.locator || `PAY-${1000 + data.paymentLinks.length + 1}`,
    concept: input.concept,
    amount: Number(input.amount) || 0,
    status: input.status || "pending",
    customerName: input.customerName || "",
    customerEmail: input.customerEmail || "",
    customerLocale: input.customerLocale || "es",
    notes: input.notes || "",
    paidAt: input.paidAt,
    paymentMethod: input.paymentMethod,
    paymentKey: input.paymentKey,
    paymentHash:
      input.paymentHash ||
      `${uid("h")}${Math.random().toString(16).slice(2, 10)}`,
    groupId: input.groupId || undefined,
    bookingId: input.bookingId || undefined,
    mode: input.mode || "standard",
    personIndex: input.personIndex,
    personLabel: input.personLabel || undefined,
  };
  data.paymentLinks.unshift(created);
  await writeData(data);
  return created;
}

export async function getPaymentLinkByHash(hash: string) {
  if (!hash) return null;
  const links = await getPaymentLinks();
  return (
    links.find((p) => p.paymentHash === hash || p.id === hash) || null
  );
}

export function buildPaymentUrl(
  item: PaymentLink,
  origin: string
): string {
  const locale = item.customerLocale || "es";
  const hash = item.paymentHash || item.id;
  const email = encodeURIComponent(item.customerEmail || "");
  return `${origin}/${locale}/gateway/?h=${hash}&email=${email}&ref=${encodeURIComponent(item.locator)}`;
}

/** Create group_all + per_person payment links for a cruise group (manual share). */
export async function ensureGroupPaymentLinks(
  group: CruiseGroup,
  options?: { forcePerPerson?: boolean; personCount?: number }
): Promise<{ groupAll: PaymentLink; perPerson: PaymentLink[] }> {
  const data = await readData();
  const existing = data.paymentLinks.filter(
    (p) => p.groupId === group.id && p.status !== "cancelled"
  );
  const price = Number(group.pricePerPerson) || 0;
  const maxPax = Math.max(
    1,
    Number(
      options?.personCount ??
        (group.maxPax != null && Number(group.maxPax) > 0
          ? group.maxPax
          : group.minPax) ??
        1
    ) || 1
  );
  const seriesLabel =
    group.seriesIndex && group.seriesIndex > 1
      ? ` · Grupo ${group.seriesIndex}`
      : "";

  let groupAll = existing.find((p) => p.mode === "group_all");
  if (!groupAll) {
    groupAll = await upsertPaymentLink({
      concept: `Grupo ${group.shipName} — ${group.excursionTitle} (${group.date})${seriesLabel} · pago completo`,
      amount: Math.round(price * maxPax * 100) / 100,
      customerName: group.shipName,
      customerLocale: "es",
      notes: `Pago de todas las plazas del grupo ${group.id}`,
      groupId: group.id,
      mode: "group_all",
      locator: `GRP-${group.id.replace(/^grp-/, "").slice(0, 10).toUpperCase()}`,
    });
  }

  let perPerson = existing
    .filter((p) => p.mode === "per_person")
    .sort((a, b) => (a.personIndex || 0) - (b.personIndex || 0));

  if (options?.forcePerPerson || perPerson.length === 0) {
    const created: PaymentLink[] = [];
    const start = perPerson.length + 1;
    for (let i = start; i <= maxPax; i++) {
      const link = await upsertPaymentLink({
        concept: `Grupo ${group.shipName} — ${group.excursionTitle} (${group.date})${seriesLabel} · persona ${i}`,
        amount: price,
        customerLocale: "es",
        notes: `Pago individual #${i} del grupo ${group.id}`,
        groupId: group.id,
        mode: "per_person",
        personIndex: i,
        personLabel: `Persona ${i}`,
        locator: `GRP-${group.id.replace(/^grp-/, "").slice(0, 8).toUpperCase()}-P${i}`,
      });
      created.push(link);
    }
    perPerson = [...perPerson, ...created].sort(
      (a, b) => (a.personIndex || 0) - (b.personIndex || 0)
    );
  }

  return { groupAll, perPerson };
}

export async function deletePaymentLink(id: string) {
  const data = await readData();
  const next = data.paymentLinks.filter((p) => p.id !== id);
  if (next.length === data.paymentLinks.length) return false;
  data.paymentLinks = next;
  await writeData(data);
  return true;
}

/* ── Collaborators ── */
export async function getCollaborators() {
  return (await readData()).collaborators;
}

export async function upsertCollaborator(
  input: Partial<Collaborator> & Pick<Collaborator, "name">
) {
  const data = await readData();
  if (input.id) {
    const idx = data.collaborators.findIndex((c) => c.id === input.id);
    if (idx >= 0) {
      data.collaborators[idx] = {
        ...data.collaborators[idx],
        ...input,
      } as Collaborator;
      await writeData(data);
      return data.collaborators[idx];
    }
  }
  const created: Collaborator = {
    id: uid("col"),
    name: input.name,
    type: input.type || "agency",
    active: input.active ?? true,
    phone: input.phone || "",
    email: input.email || "",
    contactPerson: input.contactPerson || "",
    notes: input.notes || "",
  };
  data.collaborators.unshift(created);
  await writeData(data);
  return created;
}

export async function deleteCollaborator(id: string) {
  const data = await readData();
  const next = data.collaborators.filter((c) => c.id !== id);
  if (next.length === data.collaborators.length) return false;
  data.collaborators = next;
  await writeData(data);
  return true;
}

/* ── Feedback ── */
export async function getFeedback() {
  return (await readData()).feedback;
}

export async function upsertFeedback(
  input: Partial<CustomerFeedback> &
    Pick<CustomerFeedback, "ratingGeneral" | "source">
) {
  const data = await readData();
  if (input.id) {
    const idx = data.feedback.findIndex((f) => f.id === input.id);
    if (idx >= 0) {
      data.feedback[idx] = { ...data.feedback[idx], ...input } as CustomerFeedback;
      await writeData(data);
      return data.feedback[idx];
    }
  }
  const created: CustomerFeedback = {
    id: uid("fb"),
    createdAt: new Date().toISOString(),
    bookingId: input.bookingId || "",
    ratingGeneral: Number(input.ratingGeneral) || 0,
    ratingContent: Number(input.ratingContent) || 0,
    ratingBooking: Number(input.ratingBooking) || 0,
    source: input.source,
    suggestions: input.suggestions || "",
    customerName: input.customerName || "",
  };
  data.feedback.unshift(created);
  await writeData(data);
  return created;
}

export async function deleteFeedback(id: string) {
  const data = await readData();
  const next = data.feedback.filter((f) => f.id !== id);
  if (next.length === data.feedback.length) return false;
  data.feedback = next;
  await writeData(data);
  return true;
}

/* ── Cruise ports ── */
export async function getCruisePorts() {
  return (await readData()).cruisePorts;
}

export async function upsertCruisePort(
  input: Partial<CruisePort> & Pick<CruisePort, "name">
) {
  const data = await readData();
  if (input.id) {
    const idx = data.cruisePorts.findIndex((p) => p.id === input.id);
    if (idx >= 0) {
      data.cruisePorts[idx] = { ...data.cruisePorts[idx], ...input } as CruisePort;
      await writeData(data);
      return data.cruisePorts[idx];
    }
  }
  const created: CruisePort = {
    id: uid("port"),
    name: input.name,
    region: input.region || "",
    offersExcursions: input.offersExcursions ?? false,
  };
  data.cruisePorts.unshift(created);
  await writeData(data);
  return created;
}

export async function deleteCruisePort(id: string) {
  const data = await readData();
  const next = data.cruisePorts.filter((p) => p.id !== id);
  if (next.length === data.cruisePorts.length) return false;
  data.cruisePorts = next;
  await writeData(data);
  return true;
}

/* ── Cruise groups ── */
export async function getCruiseGroups() {
  return (await readData()).cruiseGroups;
}

export async function upsertCruiseGroup(
  input: Partial<CruiseGroup> &
    Pick<CruiseGroup, "shipName" | "date" | "excursionTitle">
) {
  const data = await readData();
  if (input.id) {
    const idx = data.cruiseGroups.findIndex((g) => g.id === input.id);
    if (idx >= 0) {
      data.cruiseGroups[idx] = {
        ...data.cruiseGroups[idx],
        ...input,
      } as CruiseGroup;
      await writeData(data);
      return data.cruiseGroups[idx];
    }
  }
  const created: CruiseGroup = {
    id: uid("grp"),
    status: input.status || "open",
    shipName: input.shipName,
    company: input.company || "",
    date: input.date,
    port: input.port || "Lanzarote",
    excursionTitle: input.excursionTitle,
    complete: input.complete ?? false,
    minPax: Number(input.minPax) || 0,
    maxPax: input.maxPax != null ? Number(input.maxPax) : undefined,
    pax: Number(input.pax) || 0,
    pricePerPerson:
      input.pricePerPerson != null ? Number(input.pricePerPerson) : undefined,
    departureDate: input.departureDate || undefined,
    sailingId: input.sailingId || undefined,
    notes: input.notes || "",
    spawnedFromId: input.spawnedFromId || undefined,
    seriesIndex:
      input.seriesIndex != null ? Number(input.seriesIndex) : 1,
  };
  data.cruiseGroups.unshift(created);
  await writeData(data);
  return created;
}

export async function deleteCruiseGroup(id: string) {
  const data = await readData();
  const next = data.cruiseGroups.filter((g) => g.id !== id);
  if (next.length === data.cruiseGroups.length) return false;
  data.cruiseGroups = next;
  await writeData(data);
  return true;
}

/* ── Redirects ── */
export async function getRedirects() {
  return (await readData()).redirects;
}

export async function upsertRedirect(
  input: Partial<SeoRedirect> & Pick<SeoRedirect, "fromSlug" | "toSlug">
) {
  const data = await readData();
  if (input.id) {
    const idx = data.redirects.findIndex((r) => r.id === input.id);
    if (idx >= 0) {
      data.redirects[idx] = { ...data.redirects[idx], ...input } as SeoRedirect;
      await writeData(data);
      return data.redirects[idx];
    }
  }
  const created: SeoRedirect = {
    id: uid("redir"),
    httpCode: input.httpCode || 301,
    locale: input.locale || "es",
    fromSlug: input.fromSlug.replace(/^\/+|\/+$/g, ""),
    toSlug: input.toSlug.replace(/^\/+|\/+$/g, ""),
  };
  data.redirects.unshift(created);
  await writeData(data);
  return created;
}

export async function deleteRedirect(id: string) {
  const data = await readData();
  const next = data.redirects.filter((r) => r.id !== id);
  if (next.length === data.redirects.length) return false;
  data.redirects = next;
  await writeData(data);
  return true;
}
