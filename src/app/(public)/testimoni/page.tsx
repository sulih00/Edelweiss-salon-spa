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
    <div>
      <div className="grain relative overflow-hidden bg-gradient-to-br from-sage-800 to-sage-900 py-14 text-white">
        <div className="pointer-events-none absolute -left-20 -top-16 h-64 w-64 rounded-full bg-gold-400/20 blur-3xl" />
        <div className="relative mx-auto max-w-5xl px-4">
          <Reveal>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-gold-300">Ulasan Pelanggan</p>
            <h1 className="font-serif-display mt-2 text-4xl font-bold md:text-5xl">Cerita glowing mereka</h1>
            <p className="mt-2 max-w-xl text-sm text-white/70">Ulasan asli pelanggan Edelweiss — filter berdasarkan rating.</p>
          </Reveal>
        </div>
      </div>
      <div className="mx-auto max-w-5xl px-4 py-10">
        <TestimoniGrid data={data} />
      </div>
    </div>
  );
}
