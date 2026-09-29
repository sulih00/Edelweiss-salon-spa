import { prisma } from "@/lib/prisma";
import LayananClient from "./LayananClient";
import { Reveal } from "@/components/motion";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Layanan & Harga",
  description: "Daftar layanan Edelweiss Salon Spa beserta harga transparan: haircut, creambath, massage, facial, manicure pedicure, paket bride.",
};

export const dynamic = "force-dynamic";

export default async function Layanan() {
  const data = await prisma.produk.findMany({
    where: { aktif: true },
    include: { kategori: true },
    orderBy: [{ isLayanan: "desc" }, { harga: "asc" }],
  });

  return (
    <div>
      <div className="grain relative overflow-hidden bg-gradient-to-br from-sage-800 to-sage-900 py-14 text-white">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gold-400/20 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-4">
          <Reveal>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-gold-300">Menu & Harga</p>
            <h1 className="font-serif-display mt-2 text-4xl font-bold md:text-5xl">Layanan & Produk</h1>
            <p className="mt-2 max-w-xl text-sm text-white/70">Klik layanan untuk langsung booking — harga transparan, tanpa biaya tersembunyi.</p>
          </Reveal>
        </div>
      </div>
      <LayananClient data={data} />
    </div>
  );
}
