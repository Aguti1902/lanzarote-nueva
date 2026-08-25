import { createClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  throw new Error(
    "Define NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY antes de ejecutar el seed."
  );
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function readJson(file) {
  const raw = await readFile(path.join(root, "src", "data", file), "utf-8");
  return JSON.parse(raw);
}

async function upsertRows(table, rows, onConflict) {
  const chunkSize = 500;
  for (let start = 0; start < rows.length; start += chunkSize) {
    const chunk = rows.slice(start, start + chunkSize);
    const options = onConflict ? { onConflict } : undefined;
    const { error } = await supabase.from(table).upsert(chunk, options);
    if (error) throw new Error(`${table}: ${error.message}`);
  }
  console.log(`${table}: ${rows.length}`);
}

function bookingToRow(booking) {
  const total = booking.amountTotal ?? booking.totalPrice ?? 0;
  const paidCard =
    booking.amountPaidCard ??
    (booking.paymentMethod === "card" || booking.paymentMethod === "bizum"
      ? total
      : booking.paymentMethod === "deposit_10"
        ? Math.round(total * 10) / 100
        : 0);
  const dueCash =
    booking.amountDueCash ??
    (booking.paymentMethod === "pay_on_day"
      ? total
      : booking.paymentMethod === "deposit_10"
        ? total - paidCard
        : 0);

  return {
    id: booking.id,
    created_at: booking.createdAt,
    type: booking.type,
    tour_id: booking.tourId ?? null,
    tour_title: booking.tourTitle,
    service_date: booking.date,
    adults: booking.adults ?? 0,
    children: booking.children ?? 0,
    total_price: booking.totalPrice ?? total,
    amount_total: total,
    amount_paid_card: paidCard,
    amount_due_cash: dueCash,
    amount_paid_cash: booking.amountPaidCash ?? 0,
    payment_method: booking.paymentMethod,
    payment_status:
      booking.paymentStatus ??
      (booking.paymentMethod === "pay_on_day"
        ? "pay_on_day"
        : booking.paymentMethod === "deposit_10"
          ? "partial"
          : "paid"),
    cash_status:
      booking.cashStatus ??
      (booking.paymentMethod === "pay_on_day" ||
      booking.paymentMethod === "deposit_10"
        ? "pending"
        : "none"),
    status: booking.status ?? "confirmed",
    invoice_id: booking.invoiceId ?? null,
    cancellation_reason: booking.cancellationReason ?? null,
    cancelled_at: booking.cancelledAt ?? null,
    cancellation_fee: booking.cancellationFee ?? null,
    customer: booking.customer ?? {},
    transfer: booking.transfer ?? null,
    minibus: booking.minibus ?? null,
  };
}

function invoiceToRow(invoice) {
  return {
    id: invoice.id,
    number: invoice.number,
    type: invoice.type,
    booking_id: invoice.bookingId,
    created_at: invoice.createdAt,
    customer: invoice.customer ?? {},
    lines: invoice.lines ?? [],
    subtotal: invoice.subtotal ?? 0,
    tax_rate: invoice.taxRate ?? 0,
    tax_amount: invoice.taxAmount ?? 0,
    total: invoice.total ?? 0,
    related_invoice_id: invoice.relatedInvoiceId ?? null,
    notes: invoice.notes ?? null,
    status: invoice.status ?? "issued",
  };
}

function tourToRow(tour) {
  return {
    id: tour.id,
    slug: tour.slug,
    title: tour.title,
    short_title: tour.shortTitle,
    category: tour.category,
    group_size: tour.groupSize ?? null,
    duration: tour.duration,
    duration_hours: tour.durationHours ?? 0,
    price_adult: tour.priceAdult ?? 0,
    price_child: tour.priceChild ?? 0,
    currency: tour.currency ?? "EUR",
    rating: tour.rating ?? 0,
    review_count: tour.reviewCount ?? 0,
    image: tour.image,
    gallery: tour.gallery ?? [],
    summary: tour.summary ?? "",
    description: tour.description ?? "",
    highlights: tour.highlights ?? [],
    places: tour.places ?? [],
    included: tour.included ?? [],
    not_included: tour.notIncluded ?? [],
    recommendations: tour.recommendations ?? [],
    cancellation_policy: tour.cancellationPolicy ?? "",
    max_group: tour.maxGroup ?? null,
    languages: tour.languages ?? [],
    allow_pay_on_day: tour.allowPayOnDay ?? false,
    allow_card: tour.allowCard ?? true,
    allow_bizum: tour.allowBizum ?? true,
    cruise_friendly: tour.cruiseFriendly ?? false,
    featured: tour.featured ?? false,
  };
}

async function seed() {
  const [
    bookings,
    invoices,
    tours,
    transfers,
    blog,
    settings,
    messages,
    cruises,
    itineraries,
    adminExtras,
    uiTranslations,
    english,
    german,
  ] = await Promise.all([
    readJson("bookings.json"),
    readJson("invoices.json"),
    readJson("tours.json"),
    readJson("transfers.json"),
    readJson("blog.json"),
    readJson("settings.json"),
    readJson("messages.json"),
    readJson("cruises.json"),
    readJson("cruiseItineraries.json"),
    readJson("adminExtras.json"),
    readJson("uiTranslations.json"),
    readJson("i18n/en.json"),
    readJson("i18n/de.json"),
  ]);

  await upsertRows("tours", tours.map(tourToRow));
  await upsertRows(
    "transfer_destinations",
    transfers.destinations.map((destination) => ({
      id: destination.id,
      name: destination.name,
      slug: destination.slug,
      price_one_way: destination.priceOneWay,
      price_return: destination.priceReturn,
      duration: destination.duration,
      distance: destination.distance,
    }))
  );
  await upsertRows("transfer_meta", [
    { id: 1, highlights: transfers.highlights ?? [] },
  ]);
  await upsertRows(
    "blog_posts",
    blog.map((post) => ({
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
      image: post.image,
      date: post.date,
      author: post.author,
      tags: post.tags ?? [],
    }))
  );
  await upsertRows("site_settings", [
    { id: 1, data: settings, updated_at: new Date().toISOString() },
  ]);

  await upsertRows("bookings", bookings.map(bookingToRow));
  await upsertRows("invoices", invoices.map(invoiceToRow));
  await upsertRows(
    "contact_messages",
    messages.map((message) => ({
      id: message.id,
      created_at: message.createdAt,
      name: message.name,
      email: message.email,
      phone: message.phone ?? null,
      message: message.message,
    }))
  );

  await upsertRows("cruise_calendar_meta", [
    {
      id: 1,
      season: cruises.season,
      port: cruises.port,
      source: cruises.source,
      updated_at: cruises.updatedAt || null,
    },
  ]);
  await upsertRows(
    "cruise_calls",
    cruises.calls.map((call) => ({
      id: call.id,
      date: call.date,
      port: call.port,
      company: call.company,
      ship_code: call.shipCode ?? "",
      ship_name: call.shipName,
      arrival_time: call.arrivalTime ?? "",
      departure_time: call.departureTime ?? "",
      season: call.season ?? cruises.season ?? "",
      published: call.published ?? true,
      notes: call.notes ?? null,
    }))
  );

  await upsertRows(
    "cruise_companies",
    itineraries.companies.map((company) => ({
      slug: company.slug,
      name: company.name,
      sailing_count: company.sailingCount ?? 0,
      ships: company.ships ?? [],
    }))
  );
  await upsertRows(
    "cruise_shore_tours",
    itineraries.shoreTours.map((tour) => ({ id: tour.id, data: tour }))
  );
  await upsertRows(
    "cruise_sailings",
    itineraries.sailings.map((sailing) => ({
      id: sailing.id,
      company_slug: sailing.companySlug,
      company_name: sailing.companyName,
      ship_slug: sailing.shipSlug,
      ship_name: sailing.shipName,
      departure_date: sailing.departureDate,
      nights: sailing.nights ?? null,
      stops: sailing.stops ?? [],
    }))
  );
  await upsertRows("cruise_itineraries_meta", [
    {
      id: 1,
      updated_at: itineraries.updatedAt || null,
      source: itineraries.source ?? "",
    },
  ]);

  const extras = [
    ["payment_links", adminExtras.paymentLinks ?? []],
    ["collaborators", adminExtras.collaborators ?? []],
    ["customer_feedback", adminExtras.feedback ?? []],
    ["cruise_ports", adminExtras.cruisePorts ?? []],
    ["cruise_groups", adminExtras.cruiseGroups ?? []],
    ["seo_redirects", adminExtras.redirects ?? []],
  ];
  for (const [table, items] of extras) {
    await upsertRows(
      table,
      items.map((item) => ({ id: item.id, data: item }))
    );
  }

  await upsertRows(
    "ui_translation_overrides",
    [
      { locale: "en", data: uiTranslations.en ?? {} },
      { locale: "de", data: uiTranslations.de ?? {} },
    ],
    "locale"
  );
  await upsertRows(
    "content_translations",
    [
      { locale: "en", data: english },
      { locale: "de", data: german },
    ],
    "locale"
  );

  console.log("Seed de Supabase completado.");
}

seed().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
