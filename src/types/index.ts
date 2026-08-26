export type GroupSize = "small" | "large";
export type TourCategory = "excursion" | "private" | "minibus" | "transfer";
export type PaymentMethod =
  | "card"
  | "bizum"
  | "pay_on_day"
  | "deposit_10"
  | "deposit_20";
export type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed";
export type BookingType = "tour" | "transfer" | "minibus";
export type PaymentStatus = "unpaid" | "paid" | "pay_on_day" | "partial";
export type CashStatus = "pending" | "collected" | "waived" | "none";

export interface TourTranslation {
  title?: string;
  shortTitle?: string;
  summary?: string;
  description?: string;
  highlights?: string[];
  places?: string[];
  included?: string[];
  notIncluded?: string[];
  recommendations?: string[];
}

export type TourScheduleSlot = "morning" | "afternoon" | "evening";

export interface Tour {
  id: string;
  slug: string;
  title: string;
  shortTitle: string;
  category: TourCategory;
  groupSize?: GroupSize;
  duration: string;
  durationHours: number;
  priceAdult: number;
  priceChild: number;
  priceBaby?: number;
  priceAdultOffer?: number;
  priceChildOffer?: number;
  priceBabyOffer?: number;
  currency: string;
  rating: number;
  reviewCount: number;
  image: string;
  gallery: string[];
  summary: string;
  description: string;
  highlights: string[];
  places: string[];
  included: string[];
  notIncluded: string[];
  recommendations: string[];
  cancellationPolicy: string;
  maxGroup?: number;
  languages: string[];
  allowPayOnDay: boolean;
  allowCard: boolean;
  allowBizum: boolean;
  cruiseFriendly: boolean;
  featured?: boolean;
  /** Visible en web pública */
  active?: boolean;
  island?: string;
  isNew?: boolean;
  bookingMethod?: "online" | "request" | "phone";
  smallGroup?: boolean;
  mixLanguages?: boolean;
  priority?: number;
  activityType?: string;
  isPrivateActivity?: boolean;
  paxPerPrice?: number;
  youtubeUrl?: string;
  mapUrl?: string;
  schedule?: Record<
    string,
    Partial<Record<TourScheduleSlot, boolean[]>>
  >;
  blockedDates?: Array<{
    date: string;
    language?: string;
    seats: number;
  }>;
  seo?: {
    title?: string;
    description?: string;
    keywords?: string;
  };
  translations?: {
    en?: TourTranslation;
    de?: TourTranslation;
  };
}

export interface TransferDestination {
  id: string;
  name: string;
  slug: string;
  priceOneWay: number;
  priceReturn: number;
  /** Precio adicional por persona extra (más allá del cupo del vehículo) */
  priceExtraPerson: number;
  duration: string;
  distance: string;
}

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  image: string;
  date: string;
  author: string;
  tags: string[];
}

export interface SiteSettings {
  brandName: string;
  tagline: string;
  phone: string;
  email: string;
  hours: string;
  homeHeadline: string;
  homeSubheadline: string;
  homeHeroImage: string;
  aboutTitle: string;
  aboutLead: string;
  aboutText: string;
  aboutImage: string;
  aboutImageSecondary: string;
  aboutValues: string;
  aboutPromise: string;
  excursionsTitle: string;
  excursionsIntro: string;
  excursionsText: string;
  excursionsHeroImage: string;
  blogTitle: string;
  blogIntro: string;
  blogText: string;
  blogHeroImage: string;
  cruiseHeadline: string;
  cruiseIntro: string;
  cruiseText: string;
  cruiseHeroImage: string;
  transferTitle: string;
  transferIntro: string;
  transferText: string;
  transferHeroImage: string;
  companyLegalName?: string;
  companyTaxId?: string;
  companyAddress?: string;
  taxRate?: number;
  bannerEs?: string;
  bannerEn?: string;
  bannerDe?: string;
}

export interface PaymentLink {
  id: string;
  createdAt: string;
  locator: string;
  concept: string;
  amount: number;
  status: "pending" | "paid" | "cancelled";
  customerName?: string;
  customerEmail?: string;
  customerLocale?: "es" | "en" | "de";
  notes?: string;
  paidAt?: string;
  paymentMethod?: string;
  paymentKey?: string;
  paymentHash?: string;
}

export interface Collaborator {
  id: string;
  name: string;
  type: "agency" | "hotel" | "other";
  active: boolean;
  phone: string;
  email: string;
  contactPerson: string;
  notes?: string;
}

export interface CustomerFeedback {
  id: string;
  createdAt: string;
  bookingId?: string;
  ratingGeneral: number;
  ratingContent: number;
  ratingBooking: number;
  source: string;
  suggestions: string;
  customerName?: string;
}

export interface CruisePort {
  id: string;
  name: string;
  region: string;
  offersExcursions: boolean;
}

export interface CruiseGroup {
  id: string;
  status: "open" | "full" | "done" | "private";
  shipName: string;
  company: string;
  date: string;
  port: string;
  excursionTitle: string;
  complete: boolean;
  minPax: number;
  maxPax?: number;
  pax: number;
  pricePerPerson?: number;
  departureDate?: string;
  sailingId?: string;
  notes?: string;
}

export interface SeoRedirect {
  id: string;
  httpCode: 301 | 302;
  locale: "es" | "en" | "de";
  fromSlug: string;
  toSlug: string;
}

export interface TransfersData {
  destinations: TransferDestination[];
  highlights: string[];
}

export interface CruiseCall {
  id: string;
  date: string;
  port: string;
  company: string;
  shipCode: string;
  shipName: string;
  arrivalTime: string;
  departureTime: string;
  season: string;
  published: boolean;
  notes?: string;
}

export interface CruisesData {
  season: string;
  port: string;
  source: string;
  updatedAt: string;
  calls: CruiseCall[];
}

export interface CruiseShoreTourTranslation {
  title?: string;
  shortTitle?: string;
  summary?: string;
  description?: string;
  highlights?: string[];
  places?: string[];
}

export interface CruiseShoreTour {
  id: string;
  title: string;
  shortTitle?: string;
  summary?: string;
  description?: string;
  priceAdult: number | null;
  priceChild?: number | null;
  pricePerPerson?: number | null;
  image: string;
  gallery?: string[];
  duration: string;
  durationHours?: number;
  places: string[];
  highlights: string[];
  included?: string[];
  notIncluded?: string[];
  bookingSlug?: string;
  maxGroup?: number;
  minPax?: number;
  privatePrice?: number;
  privateMaxPax?: number;
  port?: string;
  active?: boolean;
  currency?: string;
  allowCard?: boolean;
  allowBizum?: boolean;
  allowPayOnDay?: boolean;
  cancellationPolicy?: string;
  translations?: {
    en?: CruiseShoreTourTranslation;
    de?: CruiseShoreTourTranslation;
  };
}

export interface CruiseItineraryStop {
  day: number;
  date: string | null;
  port: string;
  portKey: string;
  time: string;
  arrivalTime?: string;
  departureTime?: string;
  isSeaDay: boolean;
  hasTours: boolean;
  tourIds: string[];
}

export interface CruiseSailing {
  id: string;
  companySlug: string;
  companyName: string;
  shipSlug: string;
  shipName: string;
  departureDate: string;
  endDate?: string;
  nights: number | null;
  active?: boolean;
  stops: CruiseItineraryStop[];
}

export interface CruiseCompanyShip {
  slug: string;
  name: string;
  active?: boolean;
}

export interface CruiseCompany {
  slug: string;
  name: string;
  sailingCount: number;
  ships: CruiseCompanyShip[];
  active?: boolean;
}

export interface CruiseItinerariesData {
  updatedAt: string;
  source: string;
  companies: CruiseCompany[];
  shoreTours: CruiseShoreTour[];
  sailings: CruiseSailing[];
}

export interface Booking {
  id: string;
  createdAt: string;
  type: BookingType;
  tourId?: string;
  tourTitle: string;
  date: string;
  adults: number;
  children: number;
  totalPrice: number;
  amountTotal: number;
  amountPaidCard: number;
  amountDueCash: number;
  amountPaidCash: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  cashStatus: CashStatus;
  status: BookingStatus;
  invoiceId?: string;
  cancellationReason?: string;
  cancelledAt?: string;
  cancellationFee?: number;
  /** Optional link to a cruise group (admin / grupos cruceros). */
  groupId?: string;
  customer: {
    name: string;
    email: string;
    phone: string;
    hotel?: string;
    cruiseShip?: string;
    flightNumber?: string;
    notes?: string;
    taxId?: string;
  };
  transfer?: {
    destination: string;
    direction: "airport_to_hotel" | "hotel_to_airport" | "return";
  };
  minibus?: {
    hours: number;
  };
}

export interface InvoiceLine {
  description: string;
  qty: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  id: string;
  number: number;
  type: "invoice" | "credit_note";
  bookingId: string;
  createdAt: string;
  customer: {
    name: string;
    email: string;
    phone?: string;
    taxId?: string;
  };
  lines: InvoiceLine[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  relatedInvoiceId?: string;
  notes?: string;
  status: "issued" | "void";
}
