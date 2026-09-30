import { prisma } from "@/lib/prisma";
import { safeDb } from "@/lib/safe-db";
import BookingForm from "./BookingForm";
import { Reveal } from "@/components/motion";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Booking Online",
  description: "Booking treatment Edelweiss Salon Spa dalam 3 langkah: pilih layanan, isi data, tentukan jadwal. Konfirmasi otomatis via WhatsApp.",
};

export const dynamic = "force-dynamic";

export default async function BookingPage({ searchParams }: { searchParams: Promise<{ layanan?: string }> }) {
  const sp = await searchParams;
  const [layanan, rekening, karyawan] = await Promise.all([
    safeDb(() => prisma.produk.findMany({ where: { aktif: true, isLayanan: true }, include: { kategori: true } }), []),
    safeDb(
      () =>
        prisma.rekening.findMany({
          where: { aktif: true },
          orderBy: [{ urutan: "asc" }, { createdAt: "asc" }],
          select: { bank: true, nomor: true, atasNama: true },
        }),
      []
    ),
    safeDb(
      () =>
        prisma.karyawan.findMany({
          where: { aktif: true },
          select: { id: true, nama: true, jabatan: true },
          orderBy: { nama: "asc" },
        }),
      []
    ),
  ]);
  return (
    <div className="grain relative overflow-hidden bg-gradient-to-b from-sage-50 to-cream-50">
      <div className="pointer-events-none absolute -right-24 top-10 h-72 w-72 rounded-full bg-gold-400/20 blur-3xl" />
      <div className="relative mx-auto max-w-2xl px-4 py-12">
        <Reveal>
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-gold-500">Reservasi</p>
          <h1 className="font-serif-display mt-2 text-4xl font-bold text-sage-900 md:text-5xl">Booking Online</h1>
          <p className="mt-2 text-stone-500">3 langkah cepat — pilih terapis favorit & slot waktu kedatangan.</p>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="mt-6 rounded-[1.75rem] border border-white bg-white/90 p-6 shadow-2xl shadow-sage-900/10 backdrop-blur md:p-8">
            <BookingForm layanan={layanan} rekening={rekening} karyawan={karyawan} preselected={sp?.layanan} />
          </div>
        </Reveal>
      </div>
    </div>
  );
}
