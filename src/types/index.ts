export type GroupSize = "small" | "large";
export type TourCategory = "excursion" | "private" | "minibus" | "transfer";
export type PaymentMethod = "card" | "bizum" | "pay_on_day";
export type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed";
export type BookingType = "tour" | "transfer" | "minibus";

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
  excursionsHeroImage: string;
  blogTitle: string;
  blogIntro: string;
  blogHeroImage: string;
  cruiseHeadline: string;
  cruiseIntro: string;
  cruiseHeroImage: string;
  transferIntro: string;
  transferHeroImage: string;
}

export interface TransfersData {
  destinations: TransferDestination[];
  highlights: string[];
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
  paymentMethod: PaymentMethod;
  paymentStatus: "unpaid" | "paid" | "pay_on_day";
  status: BookingStatus;
  customer: {
    name: string;
    email: string;
    phone: string;
    hotel?: string;
    cruiseShip?: string;
    flightNumber?: string;
    notes?: string;
  };
  transfer?: {
    destination: string;
    direction: "airport_to_hotel" | "hotel_to_airport" | "return";
  };
  minibus?: {
    hours: number;
  };
}
