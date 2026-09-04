import { cache } from "react";
import type { Locale } from "@/i18n/config";
import { readCmsJson } from "@/lib/supabase/cms-store";

export type ReviewSource = "tripadvisor" | "customer" | "web";

export interface TravelerReview {
  id: string;
  tourId?: string | null;
  author: string;
  title?: string | null;
  text: string;
  rating: number;
  ratingScale?: number;
  locale?: string;
  date?: string | null;
  source?: ReviewSource | string;
  featured?: boolean;
}

export interface TripadvisorMeta {
  url: string;
  rating: number;
  reviewCount: number;
  locationId?: string;
  name?: string;
}

export interface ReviewsData {
  tripadvisor: TripadvisorMeta;
  reviews: TravelerReview[];
}

/** Deduplica lecturas de reviews en el mismo request (layout + página). */
const loadReviews = cache(async (): Promise<ReviewsData> => {
  return readCmsJson<ReviewsData>("reviews.json");
});

function localeScore(review: TravelerReview, locale: Locale): number {
  if (!review.locale) return 0;
  if (review.locale === locale) return 3;
  if (locale === "es" && review.locale === "en") return 1;
  if (locale !== "es" && review.locale === "en") return 2;
  return 0;
}

function sortForLocale(reviews: TravelerReview[], locale: Locale) {
  return [...reviews].sort((a, b) => {
    const ls = localeScore(b, locale) - localeScore(a, locale);
    if (ls) return ls;
    const feat = Number(!!b.featured) - Number(!!a.featured);
    if (feat) return feat;
    const rating = (b.rating || 0) - (a.rating || 0);
    if (rating) return rating;
    return (b.text?.length || 0) - (a.text?.length || 0);
  });
}

export async function getTripadvisorMeta(): Promise<TripadvisorMeta> {
  try {
    return await readCmsJson<TripadvisorMeta>("tripadvisor.json");
  } catch {
    const data = await loadReviews();
    return data.tripadvisor;
  }
}

export async function getFeaturedReviews(
  locale: Locale,
  limit = 6
): Promise<TravelerReview[]> {
  const data = await loadReviews();
  const featured = data.reviews.filter(
    (r) => r.featured || (!r.tourId && (r.rating || 0) >= 4.5)
  );
  const pool = featured.length ? featured : data.reviews;
  return sortForLocale(pool, locale).slice(0, limit);
}

export async function getReviewsForTour(
  tourId: string,
  locale: Locale,
  limit = 6
): Promise<TravelerReview[]> {
  const data = await loadReviews();
  const forTour = data.reviews.filter((r) => r.tourId === tourId);
  if (forTour.length >= 3) {
    return sortForLocale(forTour, locale).slice(0, limit);
  }
  const extras = sortForLocale(
    data.reviews.filter((r) => r.featured || !r.tourId),
    locale
  );
  const merged = [...sortForLocale(forTour, locale)];
  for (const r of extras) {
    if (merged.length >= limit) break;
    if (merged.some((m) => m.id === r.id || m.text === r.text)) continue;
    merged.push(r);
  }
  return merged.slice(0, limit);
}
