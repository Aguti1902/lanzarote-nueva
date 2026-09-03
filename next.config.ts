import type { NextConfig } from "next";
import { LEGACY_PATH_REDIRECTS } from "./src/lib/legacy-redirects";

const legacyRedirects = Object.entries(LEGACY_PATH_REDIRECTS).flatMap(
  ([source, destination]) => [
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
  ]
);

const nextConfig: NextConfig = {
  // Cloud agent / remote browser may hit the app via 127.0.0.1
  allowedDevOrigins: ["127.0.0.1", "localhost"],
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
      // Prefijos EN/DE de secciones (catch-all)
      {
        source: "/en/excursions/:path*",
        destination: "/en/excursiones/:path*",
        permanent: true,
      },
      {
        source: "/de/ausfluge/:path*",
        destination: "/de/excursiones/:path*",
        permanent: true,
      },
      {
        source: "/en/cruise-excursions/:path*",
        destination: "/en/excursiones-cruceros/:path*",
        permanent: true,
      },
      {
        source: "/de/kreuzfahrtausfluge/:path*",
        destination: "/de/excursiones-cruceros/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
