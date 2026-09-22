import type { NextConfig } from "next";
import { LEGACY_PATH_REDIRECTS } from "./src/lib/legacy-redirects";

/**
 * Redirects estáticos (301/308) para URLs legacy.
 * La traducción de slugs públicos (EN/DE) → carpetas ES se hace con
 * rewrite en middleware (`src/middleware.ts`), no aquí.
 *
 * No volcar fuentes que sean prefijo de una carpeta interna
 * (`/en/traslados` pisa `/en/traslados-aeropuerto-lanzarote` tras el rewrite).
 */
const NEXT_STATIC_REDIRECT_SKIP = new Set(["/en/traslados", "/de/traslados"]);

const legacyRedirects = Object.entries(LEGACY_PATH_REDIRECTS).flatMap(
  ([source, destination]) => {
    if (source === destination) return [];
    if (NEXT_STATIC_REDIRECT_SKIP.has(source)) return [];
    return [
      {
        source,
        destination,
        statusCode: 301 as const,
      },
      {
        source: `${source}/`,
        destination,
        statusCode: 301 as const,
      },
    ];
  }
);

const nextConfig: NextConfig = {
  // Evita el 308 automático /ruta/ → /ruta, para poder 301 de una sola vez
  // (p. ej. /en/cruise-excursions/marella-cruises/ → /en/shore-excursions/...).
  skipTrailingSlashRedirect: true,
  // Cloud agent / remote browser may hit the app via 127.0.0.1
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  serverExternalPackages: ["exceljs"],
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
        statusCode: 301,
      },
      {
        source: "/de/ausfluge/:path*",
        destination: "/de/ausfluege/:path*",
        statusCode: 301,
      },
      {
        source: "/en/cruise-excursions",
        destination: "/en/shore-excursions",
        statusCode: 301,
      },
      {
        source: "/en/cruise-excursions/",
        destination: "/en/shore-excursions",
        statusCode: 301,
      },
      {
        source: "/en/cruise-excursions/:path*",
        destination: "/en/shore-excursions/:path*",
        statusCode: 301,
      },
      {
        source: "/en/cruise-excursions/:path*/",
        destination: "/en/shore-excursions/:path*",
        statusCode: 301,
      },
      {
        source: "/de/kreuzfahrtausfluge",
        destination: "/de/kreuzfahrtausfluege",
        statusCode: 301,
      },
      {
        source: "/de/kreuzfahrtausfluge/:path*",
        destination: "/de/kreuzfahrtausfluege/:path*",
        statusCode: 301,
      },
      // Prefijos ES con locale EN/DE → slugs traducidos
      {
        source: "/en/excursiones",
        destination: "/en/excursions",
        statusCode: 301,
      },
      {
        source: "/en/excursiones/:path*",
        destination: "/en/excursions/:path*",
        statusCode: 301,
      },
      {
        source: "/de/excursiones",
        destination: "/de/ausfluege",
        statusCode: 301,
      },
      {
        source: "/de/excursiones/:path*",
        destination: "/de/ausfluege/:path*",
        statusCode: 301,
      },
      {
        source: "/en/excursiones-cruceros",
        destination: "/en/shore-excursions",
        statusCode: 301,
      },
      {
        source: "/en/excursiones-cruceros/:path*",
        destination: "/en/shore-excursions/:path*",
        statusCode: 301,
      },
      {
        source: "/de/excursiones-cruceros",
        destination: "/de/kreuzfahrtausfluege",
        statusCode: 301,
      },
      {
        source: "/de/excursiones-cruceros/:path*",
        destination: "/de/kreuzfahrtausfluege/:path*",
        statusCode: 301,
      },
      {
        source: "/en/crucero/:path*",
        destination: "/en/cruise/:path*",
        statusCode: 301,
      },
      {
        source: "/de/crucero/:path*",
        destination: "/de/kreuzfahrt/:path*",
        statusCode: 301,
      },
      // URLs sin idioma (Google / bookmarks) → locale canónico
      {
        source: "/excursiones/:path*",
        destination: "/es/excursiones/:path*",
        statusCode: 301,
      },
      {
        source: "/excursiones-cruceros/:path*",
        destination: "/es/excursiones-cruceros/:path*",
        statusCode: 301,
      },
      {
        source: "/blog/:path*",
        destination: "/es/blog/:path*",
        statusCode: 301,
      },
      {
        source: "/excursions/:path*",
        destination: "/en/excursions/:path*",
        statusCode: 301,
      },
      {
        source: "/shore-excursions/:path*",
        destination: "/en/shore-excursions/:path*",
        statusCode: 301,
      },
      {
        source: "/cruise-excursions/:path*",
        destination: "/en/shore-excursions/:path*",
        statusCode: 301,
      },
      {
        source: "/ausfluege/:path*",
        destination: "/de/ausfluege/:path*",
        statusCode: 301,
      },
      {
        source: "/kreuzfahrtausfluege/:path*",
        destination: "/de/kreuzfahrtausfluege/:path*",
        statusCode: 301,
      },
    ];
  },
};

export default nextConfig;
