import { prisma } from "@/lib/prisma";
import GaleriGrid from "./GaleriGrid";
import { Reveal } from "@/components/motion";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Galeri",
  description: "Lihat suasana outlet Edelweiss Salon Spa: ruang spa yang tenang, hair studio, dan nail corner.",
};

export const dynamic = "force-dynamic";

export default async function Galeri() {
  const data = await prisma.galeri.findMany({ where: { tampil: true } });
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <Reveal>
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-gold-500">Suasana Outlet</p>
        <h1 className="font-serif-display mt-2 text-4xl font-bold text-sage-900 md:text-5xl">Galeri Edelweiss</h1>
        <p className="mt-2 text-stone-500">Klik foto untuk memperbesar. Ruang tenang, wangi, dan estetik.</p>
      </Reveal>
      <GaleriGrid data={data} />
    </div>
  );
}
