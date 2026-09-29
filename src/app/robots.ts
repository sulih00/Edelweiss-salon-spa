import type { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://edelweiss-salon-spa.local";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/cms/", "/api/", "/login"],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
  };
}
