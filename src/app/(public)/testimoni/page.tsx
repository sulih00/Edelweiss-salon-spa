import { prisma } from "@/lib/prisma";
import { safeDb } from "@/lib/safe-db";
import TestimoniGrid from "./TestimoniGrid";
import { Reveal } from "@/components/motion";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Testimoni",
  description: "Ulasan asli pelanggan Edelweiss Salon Makeup Art dengan rating 4.9 dari 800+ treatment.",
};

export const dynamic = "force-dynamic";

export default async function Testimoni() {
  const data = await safeDb(() => prisma.testimoni.findMany({ where: { tampil: true } }), []);
  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <Reveal>
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-gold-500">Ulasan Pelanggan</p>
        <h1 className="font-serif-display mt-2 text-4xl font-bold text-sage-900 md:text-5xl">Cerita glowing mereka</h1>
        <p className="mt-2 text-stone-500">Ulasan asli pelanggan Edelweiss — filter berdasarkan rating.</p>
      </Reveal>
      <TestimoniGrid data={data} />
    </div>
  );
}
