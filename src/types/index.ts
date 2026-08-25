export type GroupSize = "small" | "large";
export type TourCategory = "excursion" | "private" | "minibus" | "transfer";
export type PaymentMethod = "card" | "bizum" | "pay_on_day" | "deposit_10";
export type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed";
export type BookingType = "tour" | "transfer" | "minibus";
export type PaymentStatus = "unpaid" | "paid" | "pay_on_day" | "partial";
export type CashStatus = "pending" | "collected" | "waived" | "none";

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
}

export interface TransferDestination {
  id: string;
  name: string;
  slug: string;
  priceOneWay: number;
  priceReturn: number;
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
  notes?: string;
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
  pax: number;
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
  duration: string;
  places: string[];
  highlights: string[];
  included?: string[];
  notIncluded?: string[];
  bookingSlug?: string;
  maxGroup?: number;
  currency?: string;
  allowCard?: boolean;
  allowBizum?: boolean;
  allowPayOnDay?: boolean;
  cancellationPolicy?: string;
}

export interface CruiseItineraryStop {
  day: number;
  date: string | null;
  port: string;
  portKey: string;
  time: string;
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
  nights: number | null;
  stops: CruiseItineraryStop[];
}

export interface CruiseCompanyShip {
  slug: string;
  name: string;
}

export interface CruiseCompany {
  slug: string;
  name: string;
  sailingCount: number;
  ships: CruiseCompanyShip[];
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
