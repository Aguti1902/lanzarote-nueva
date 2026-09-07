import type { NextConfig } from "next";
import { LEGACY_PATH_REDIRECTS } from "./src/lib/legacy-redirects";

/**
 * Redirects estáticos (301/308) para URLs legacy.
 * La traducción de slugs públicos (EN/DE) → carpetas ES se hace con
 * rewrite en middleware (`src/middleware.ts`), no aquí.
 */
const legacyRedirects = Object.entries(LEGACY_PATH_REDIRECTS).flatMap(
  ([source, destination]) => {
    if (source === destination) return [];
    return [
      {
        source,
        destination,
        permanent: true as const,
      },
      {
        source: `${source}/`,
        destination,
        permanent: true as const,
      },
    ];
  }
);

const nextConfig: NextConfig = {
  // Cloud agent / remote browser may hit the app via 127.0.0.1
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "img.holidu.com",
      },
      {
        protocol: "https",
        hostname: "wdnviethdarcmneghhqv.supabase.co",
      },
      {
        protocol: "https",
        hostname: "www.lanzaroteexperiencetours.com",
      },
    ],
  },
  async redirects() {
    return [
      ...legacyRedirects,
      // Variantes legacy de prefijo (sin umlaut / nombres antiguos)
      {
        source: "/de/ausfluge",
        destination: "/de/ausfluege",
        permanent: true,
      },
      {
        source: "/de/ausfluge/:path*",
        destination: "/de/ausfluege/:path*",
        permanent: true,
      },
      {
        source: "/en/cruise-excursions",
        destination: "/en/shore-excursions",
        permanent: true,
      },
      {
        source: "/en/cruise-excursions/:path*",
        destination: "/en/shore-excursions/:path*",
        permanent: true,
      },
      {
        source: "/de/kreuzfahrtausfluge",
        destination: "/de/kreuzfahrtausfluege",
        permanent: true,
      },
      {
        source: "/de/kreuzfahrtausfluge/:path*",
        destination: "/de/kreuzfahrtausfluege/:path*",
        permanent: true,
      },
      // Prefijos ES con locale EN/DE → slugs traducidos
      {
        source: "/en/excursiones",
        destination: "/en/excursions",
        permanent: true,
      },
      {
        source: "/en/excursiones/:path*",
        destination: "/en/excursions/:path*",
        permanent: true,
      },
      {
        source: "/de/excursiones",
        destination: "/de/ausfluege",
        permanent: true,
      },
      {
        source: "/de/excursiones/:path*",
        destination: "/de/ausfluege/:path*",
        permanent: true,
      },
      {
        source: "/en/excursiones-cruceros",
        destination: "/en/shore-excursions",
        permanent: true,
      },
      {
        source: "/en/excursiones-cruceros/:path*",
        destination: "/en/shore-excursions/:path*",
        permanent: true,
      },
      {
        source: "/de/excursiones-cruceros",
        destination: "/de/kreuzfahrtausfluege",
        permanent: true,
      },
      {
        source: "/de/excursiones-cruceros/:path*",
        destination: "/de/kreuzfahrtausfluege/:path*",
        permanent: true,
      },
      {
        source: "/en/crucero/:path*",
        destination: "/en/cruise/:path*",
        permanent: true,
      },
      {
        source: "/de/crucero/:path*",
        destination: "/de/kreuzfahrt/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
