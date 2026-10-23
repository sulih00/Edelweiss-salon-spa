import { prisma } from "@/lib/prisma";
import { safeDb } from "@/lib/safe-db";
import GaleriGrid from "./GaleriGrid";
import { Reveal } from "@/components/motion";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Galeri",
  description: "Lihat suasana outlet Edelweiss Salon Makeup Art: studio makeup art yang tenang, hair studio, dan nail corner.",
};

export const dynamic = "force-dynamic";

export default async function Galeri() {
  const data = await safeDb(() => prisma.galeri.findMany({ where: { tampil: true } }), []);
  return (
    <div>
      <div className="grain relative overflow-hidden bg-gradient-to-br from-sage-800 to-sage-900 py-14 text-white">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gold-400/20 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-4">
          <Reveal>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-gold-300">Suasana Outlet</p>
            <h1 className="font-serif-display mt-2 text-4xl font-bold md:text-5xl">Galeri Edelweiss</h1>
            <p className="mt-2 max-w-xl text-sm text-white/70">Klik foto untuk memperbesar. Ruang tenang, wangi, dan estetik.</p>
          </Reveal>
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-4 py-10">
        <GaleriGrid data={data} />
      </div>
    </div>
  );
}
