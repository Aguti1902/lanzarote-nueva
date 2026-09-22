import type {
  Collaborator,
  CruiseGroup,
  CruisePort,
  CustomerFeedback,
  PaymentLink,
  SeoRedirect,
} from "@/types";
import { readCmsJsonFresh, writeCmsJson } from "@/lib/supabase/cms-store";
import { resolvePublicOrigin } from "@/lib/voucher";

export type AdminExtrasData = {
  paymentLinks: PaymentLink[];
  collaborators: Collaborator[];
  feedback: CustomerFeedback[];
  cruisePorts: CruisePort[];
  cruiseGroups: CruiseGroup[];
  redirects: SeoRedirect[];
  /** ISO date when past cruise groups were purged for a clean restart */
  cruiseGroupsResetAt?: string;
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
    const stored = await readCmsJsonFresh<Partial<AdminExtrasData>>(
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

export async function getPaymentLinkByHash(hash: string) {
  if (!hash) return null;
  const links = await getPaymentLinks();
  return (
    links.find((p) => p.paymentHash === hash || p.id === hash) || null
  );
}

export function buildPaymentLinkDraft(
  input: Partial<PaymentLink> & Pick<PaymentLink, "concept" | "amount">
): PaymentLink {
  return {
    id: input.id || uid("pay"),
    createdAt: input.createdAt || new Date().toISOString(),
    locator: input.locator || `PAY-${Date.now().toString(36).slice(-6).toUpperCase()}`,
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
    bookingIds: input.bookingIds?.length
      ? [...input.bookingIds]
      : input.bookingId
        ? [input.bookingId]
        : undefined,
    mode: input.mode || "standard",
    personIndex: input.personIndex,
    personLabel: input.personLabel || undefined,
    serviceType: input.serviceType || "custom",
    serviceId: input.serviceId,
    serviceTitle: input.serviceTitle,
    chargeFull: input.chargeFull ?? true,
    stripeCheckoutSessionId: input.stripeCheckoutSessionId,
    stripePaymentIntentId: input.stripePaymentIntentId,
    stripeCheckoutUrl: input.stripeCheckoutUrl,
  };
}

export async function upsertPaymentLink(
  input: Partial<PaymentLink> & Pick<PaymentLink, "concept" | "amount">
) {
  const data = await readData();
  if (input.id) {
    const idx = data.paymentLinks.findIndex((p) => p.id === input.id);
    if (idx >= 0) {
      const merged = {
        ...data.paymentLinks[idx],
        ...input,
      } as PaymentLink;
      // Vaciar sesión Stripe si se pide explícitamente (importe editado)
      if (input.stripeCheckoutUrl === "") {
        delete merged.stripeCheckoutUrl;
        delete merged.stripeCheckoutSessionId;
        delete merged.stripePaymentIntentId;
      }
      if (input.bookingIds) {
        merged.bookingIds = [...input.bookingIds];
      }
      data.paymentLinks[idx] = merged;
      await writeData(data);
      return data.paymentLinks[idx];
    }
  }
  const created = buildPaymentLinkDraft({
    ...input,
    locator: input.locator || `PAY-${1000 + data.paymentLinks.length + 1}`,
  });
  data.paymentLinks.unshift(created);
  await writeData(data);
  return created;
}

export function buildPaymentUrl(
  item: PaymentLink,
  origin: string
): string {
  const base = resolvePublicOrigin(origin);
  const locale = item.customerLocale || "es";
  const hash = item.paymentHash || item.id;
  const params = new URLSearchParams();
  params.set("h", hash);
  if (item.customerEmail) params.set("email", item.customerEmail);
  params.set("ref", item.locator);
  return `${base}/${locale}/gateway/?${params.toString()}`;
}

/** Capacidad máxima del grupo para generar enlaces de pago. */
export function groupPaymentMaxPax(group: CruiseGroup): number {
  return Math.max(
    1,
    Number(
      group.maxPax != null && Number(group.maxPax) > 0
        ? group.maxPax
        : group.minPax
    ) || 1
  );
}

/**
 * Plazas que ya no deben tener enlace de pago pendiente:
 * reservas activas del grupo + cobros individuales ya pagados por enlace.
 */
export function occupiedPaxForGroupPayments(
  bookedPax: number,
  links: PaymentLink[]
): number {
  const paidSolo = links.filter(
    (p) =>
      p.mode === "per_person" &&
      p.status === "paid" &&
      p.groupId
  ).length;
  return Math.max(0, Number(bookedPax) || 0) + paidSolo;
}

/** Create/sync group_all + per_person payment links for a cruise group. */
export async function ensureGroupPaymentLinks(
  group: CruiseGroup,
  options?: {
    forcePerPerson?: boolean;
    /** @deprecated Preferir bookedPax; si se pasa solo, se interpreta como plazas pendientes. */
    personCount?: number;
    /** Personas ya inscritas por reserva (sin contar pagos sueltos por enlace). */
    bookedPax?: number;
    /** @deprecated Preferir bookedPax (ocupación total ya calculada). */
    occupiedPax?: number;
  }
): Promise<{ groupAll: PaymentLink; perPerson: PaymentLink[] }> {
  const data = await readData();
  const existing = data.paymentLinks.filter(
    (p) => p.groupId === group.id && p.status !== "cancelled"
  );
  const price = Number(group.pricePerPerson) || 0;
  const maxPax = groupPaymentMaxPax(group);
  const paidSoloCount = existing.filter(
    (p) => p.mode === "per_person" && p.status === "paid"
  ).length;

  let remaining: number;
  if (options?.bookedPax != null) {
    remaining = Math.max(
      0,
      maxPax -
        Math.max(0, Math.floor(Number(options.bookedPax) || 0)) -
        paidSoloCount
    );
  } else if (options?.occupiedPax != null) {
    remaining = Math.max(
      0,
      maxPax - Math.max(0, Math.floor(Number(options.occupiedPax) || 0))
    );
  } else if (options?.personCount != null) {
    remaining = Math.max(
      0,
      Math.min(maxPax, Math.floor(Number(options.personCount) || 0))
    );
  } else {
    remaining = Math.max(0, maxPax - paidSoloCount);
  }

  const amountGroup = Math.round(price * remaining * 100) / 100;
  const seriesLabel =
    group.seriesIndex && group.seriesIndex > 1
      ? ` · Grupo ${group.seriesIndex}`
      : "";
  const shortId = group.id.replace(/^grp-/, "").slice(0, 10).toUpperCase();
  const shortIdP = group.id.replace(/^grp-/, "").slice(0, 8).toUpperCase();

  let groupAll =
    existing.find((p) => p.mode === "group_all") ||
    data.paymentLinks.find(
      (p) => p.groupId === group.id && p.mode === "group_all"
    );
  if (!groupAll) {
    if (remaining > 0) {
      groupAll = await upsertPaymentLink({
        concept: `Grupo ${group.shipName} — ${group.excursionTitle} (${group.date})${seriesLabel} · plazas pendientes`,
        amount: amountGroup,
        customerName: group.shipName,
        customerLocale: "es",
        notes: `Pago de las ${remaining} plaza(s) pendientes del grupo ${group.id} (máx. ${maxPax})`,
        groupId: group.id,
        mode: "group_all",
        locator: `GRP-${shortId}`,
        chargeFull: true,
      });
    } else {
      // Grupo lleno: no crear enlace cobrable
      groupAll = await upsertPaymentLink({
        concept: `Grupo ${group.shipName} — ${group.excursionTitle} (${group.date})${seriesLabel} · sin plazas pendientes`,
        amount: 0,
        customerName: group.shipName,
        customerLocale: "es",
        notes: `Sin plazas pendientes de pago · grupo ${group.id}`,
        groupId: group.id,
        mode: "group_all",
        locator: `GRP-${shortId}`,
        status: "cancelled",
        chargeFull: true,
      });
    }
  } else if (groupAll.status !== "paid") {
    const amountChanged = Math.abs(Number(groupAll.amount) - amountGroup) > 0.009;
    if (remaining <= 0) {
      groupAll = await upsertPaymentLink({
        ...groupAll,
        amount: 0,
        status: "cancelled",
        concept: `Grupo ${group.shipName} — ${group.excursionTitle} (${group.date})${seriesLabel} · sin plazas pendientes`,
        notes: `Sin plazas pendientes de pago · grupo ${group.id}`,
        stripeCheckoutUrl: "",
      });
    } else if (
      amountChanged ||
      groupAll.status === "cancelled" ||
      options?.forcePerPerson
    ) {
      groupAll = await upsertPaymentLink({
        ...groupAll,
        amount: amountGroup,
        status: "pending",
        concept: `Grupo ${group.shipName} — ${group.excursionTitle} (${group.date})${seriesLabel} · plazas pendientes`,
        notes: `Pago de las ${remaining} plaza(s) pendientes del grupo ${group.id} (máx. ${maxPax})`,
        chargeFull: true,
        ...(amountChanged ? { stripeCheckoutUrl: "" } : {}),
      });
    }
  }

  let perPerson = existing
    .filter((p) => p.mode === "per_person")
    .sort((a, b) => (a.personIndex || 0) - (b.personIndex || 0));

  const paidPerPerson = perPerson.filter((p) => p.status === "paid");
  let pendingPerPerson = perPerson.filter((p) => p.status === "pending");

  // «Uno a uno» solo si el grupo se creó a mano en el panel.
  // Un grupo nacido de una reserva online no debe inventar plazas sueltas.
  const includePerPerson = group.createdManually === true;
  if (!includePerPerson) {
    for (const p of pendingPerPerson) {
      await upsertPaymentLink({ ...p, status: "cancelled" });
    }
    return { groupAll, perPerson: paidPerPerson };
  }

  const targetPending = remaining;

  if (options?.forcePerPerson) {
    for (const p of pendingPerPerson) {
      await upsertPaymentLink({ ...p, status: "cancelled" });
    }
    pendingPerPerson = [];
  } else if (pendingPerPerson.length > targetPending) {
    const extras = pendingPerPerson.slice(targetPending);
    for (const p of extras) {
      await upsertPaymentLink({ ...p, status: "cancelled" });
    }
    pendingPerPerson = pendingPerPerson.slice(0, targetPending);
  }

  if (pendingPerPerson.length < targetPending) {
    const created: PaymentLink[] = [];
    const start = pendingPerPerson.length + 1;
    for (let i = start; i <= targetPending; i++) {
      const link = await upsertPaymentLink({
        concept: `Grupo ${group.shipName} — ${group.excursionTitle} (${group.date})${seriesLabel} · persona ${i}`,
        amount: price,
        customerLocale: "es",
        notes: `Pago individual #${i} del grupo ${group.id} (${remaining} pendientes)`,
        groupId: group.id,
        mode: "per_person",
        personIndex: i,
        personLabel: `Persona ${i}`,
        locator: `GRP-${shortIdP}-P${i}`,
        chargeFull: true,
      });
      created.push(link);
    }
    pendingPerPerson = [...pendingPerPerson, ...created];
  }

  // Renumerar etiquetas de pendientes 1..N para que coincidan con plazas libres
  const renumbered: PaymentLink[] = [];
  for (let i = 0; i < pendingPerPerson.length; i++) {
    const idx = i + 1;
    const p = pendingPerPerson[i];
    if (
      p.personIndex !== idx ||
      p.personLabel !== `Persona ${idx}` ||
      Math.abs(Number(p.amount) - price) > 0.009
    ) {
      renumbered.push(
        await upsertPaymentLink({
          ...p,
          personIndex: idx,
          personLabel: `Persona ${idx}`,
          amount: price,
          concept: `Grupo ${group.shipName} — ${group.excursionTitle} (${group.date})${seriesLabel} · persona ${idx}`,
          notes: `Pago individual #${idx} del grupo ${group.id}`,
          locator: `GRP-${shortIdP}-P${idx}`,
          ...(Math.abs(Number(p.amount) - price) > 0.009
            ? { stripeCheckoutUrl: "" }
            : {}),
        })
      );
    } else {
      renumbered.push(p);
    }
  }

  perPerson = [...paidPerPerson, ...renumbered].sort(
    (a, b) => (a.personIndex || 0) - (b.personIndex || 0)
  );

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
const CRUISE_GROUPS_RESET_AT = "2026-09-01";

export async function getCruiseGroups() {
  const data = await readData();
  // One-shot: wipe historical past groups and keep only current/future.
  if (data.cruiseGroupsResetAt !== CRUISE_GROUPS_RESET_AT) {
    const today = new Date().toISOString().slice(0, 10);
    const kept = data.cruiseGroups.filter(
      (g) => (g.date || "").slice(0, 10) >= today
    );
    data.cruiseGroups = kept;
    data.cruiseGroupsResetAt = CRUISE_GROUPS_RESET_AT;
    await writeData(data);
    return kept;
  }
  return data.cruiseGroups;
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
    createdManually: input.createdManually === true,
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
