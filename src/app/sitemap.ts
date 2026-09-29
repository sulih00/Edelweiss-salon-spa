import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://edelweiss-salon-spa.local";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = ["", "/tentang", "/layanan", "/promo", "/galeri", "/testimoni", "/booking", "/kontak"].map((p) => ({
    url: `${BASE}${p || "/"}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: p === "" ? 1 : 0.7,
  }));

  const [produk, promo] = await Promise.all([
    prisma.produk.findMany({ where: { aktif: true, isLayanan: true }, select: { id: true } }),
    prisma.promo.findMany({ where: { aktif: true }, select: { id: true } }),
  ]);

  return [
    ...staticRoutes,
    ...produk.map((p) => ({
      url: `${BASE}/booking?layanan=${p.id}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
    ...promo.map(() => ({
      url: `${BASE}/promo`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];
}
