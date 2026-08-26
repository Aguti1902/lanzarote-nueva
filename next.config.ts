import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
    ],
  },
};

export default nextConfig;
