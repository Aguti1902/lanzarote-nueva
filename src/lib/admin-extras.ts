import { promises as fs } from "fs";
import path from "path";
import type {
  Collaborator,
  CruiseGroup,
  CruisePort,
  CustomerFeedback,
  PaymentLink,
  SeoRedirect,
} from "@/types";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/client";

const dataPath = path.join(process.cwd(), "src/data/adminExtras.json");

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

function freshEmpty(): AdminExtrasData {
  return {
    paymentLinks: [],
    collaborators: [],
    feedback: [],
    cruisePorts: [],
    cruiseGroups: [],
    redirects: [],
  };
}

async function readDataJson(): Promise<AdminExtrasData> {
  try {
    const raw = await fs.readFile(dataPath, "utf-8");
    return { ...empty, ...(JSON.parse(raw) as AdminExtrasData) };
  } catch {
    return freshEmpty();
  }
}

async function writeDataJson(data: AdminExtrasData): Promise<void> {
  await fs.writeFile(dataPath, JSON.stringify(data, null, 2) + "\n", "utf-8");
}

async function readTable<T extends { id: string }>(table: string): Promise<T[]> {
  const { data, error } = await getSupabaseAdmin()
    .from(table)
    .select("id, data");
  if (error) throw new Error(error.message);
  return (data || []).map((row) => ({
    ...(row.data as T),
    id: String(row.id),
  }));
}

async function replaceTable<T extends { id: string }>(
  table: string,
  items: T[]
): Promise<void> {
  const sb = getSupabaseAdmin();
  if (items.length) {
    const { error } = await sb
      .from(table)
      .upsert(items.map((item) => ({ id: item.id, data: item })));
    if (error) throw new Error(error.message);
  }

  const { data: existing, error: readError } = await sb
    .from(table)
    .select("id");
  if (readError) throw new Error(readError.message);
  const keep = new Set(items.map((item) => item.id));
  const removed = (existing || [])
    .map((row) => String(row.id))
    .filter((id) => !keep.has(id));
  if (removed.length) {
    const { error } = await sb.from(table).delete().in("id", removed);
    if (error) throw new Error(error.message);
  }
}

async function readData(): Promise<AdminExtrasData> {
  if (!isSupabaseConfigured()) return readDataJson();

  const [
    paymentLinks,
    collaborators,
    feedback,
    cruisePorts,
    cruiseGroups,
    redirects,
  ] = await Promise.all([
    readTable<PaymentLink>("payment_links"),
    readTable<Collaborator>("collaborators"),
    readTable<CustomerFeedback>("customer_feedback"),
    readTable<CruisePort>("cruise_ports"),
    readTable<CruiseGroup>("cruise_groups"),
    readTable<SeoRedirect>("seo_redirects"),
  ]);
  return {
    paymentLinks,
    collaborators,
    feedback,
    cruisePorts,
    cruiseGroups,
    redirects,
  };
}

async function writeData(data: AdminExtrasData): Promise<void> {
  if (!isSupabaseConfigured()) {
    await writeDataJson(data);
    return;
  }

  await Promise.all([
    replaceTable("payment_links", data.paymentLinks),
    replaceTable("collaborators", data.collaborators),
    replaceTable("customer_feedback", data.feedback),
    replaceTable("cruise_ports", data.cruisePorts),
    replaceTable("cruise_groups", data.cruiseGroups),
    replaceTable("seo_redirects", data.redirects),
  ]);
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
    notes: input.notes || "",
  };
  data.paymentLinks.unshift(created);
  await writeData(data);
  return created;
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
    pax: Number(input.pax) || 0,
    notes: input.notes || "",
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
