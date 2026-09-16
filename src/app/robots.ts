import type { MetadataRoute } from "next";
import { resolvePublicOrigin } from "@/lib/voucher";

export default function robots(): MetadataRoute.Robots {
  const origin = resolvePublicOrigin();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/", "/gateway/", "/voucher", "/factura"],
      },
    ],
    sitemap: `${origin}/sitemap.xml`,
  };
}