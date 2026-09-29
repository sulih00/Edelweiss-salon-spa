import { prisma } from "@/lib/prisma";
import { Reveal, SectionHeading } from "@/components/motion";
import { Leaf, HeartHandshake, Sparkles, Award } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tentang Kami",
  description: "Cerita Edelweiss Salon Spa: terapis bersertifikat, produk aman BPOM, dan ruangan tenang untuk merawat diri.",
};

const values = [
  { icon: Leaf, t: "Bahan alami & aman", d: "Produk BPOM, essential oil murni, dan alat steril setiap pemakaian." },
  { icon: HeartHandshake, t: "Pelayanan tulus", d: "Konsultasi jujur — kami sarankan yang kamu butuhkan, bukan yang termahal." },
  { icon: Award, t: "Terapis bersertifikat", d: "Tim dilatih rutin: hair, spa, facial, dan nail art." },
  { icon: Sparkles, t: "Detail estetik", d: "Ruangan wangi, musik lembut, teh hangat — setiap kunjungan terasa spesial." },
];

export default async function Tentang() {
  const [bookingCount, karyawanCount, testimoniCount] = await Promise.all([
    prisma.booking.count(),
    prisma.karyawan.count({ where: { aktif: true } }),
    prisma.testimoni.count({ where: { tampil: true } }),
  ]);

  const timeline = [
    ["2018", "Awal mula", "Buka home-studio kecil dengan 2 kursi hair wash dan 1 bed massage."],
    ["2021", "Pindah ruko", "Ekspansi ke 6 bed, tambah facial room dan nail corner."],
    ["2024", "Digital booking", "Booking online + CMS keuangan agar pelayanan makin rapi."],
    ["2026", "Edelweiss hari ini", `${bookingCount > 0 ? `${bookingCount}+` : "5.000+"} treatment, ${testimoniCount > 0 ? `${testimoniCount} ulasan` : "rating 4.9"}, ${karyawanCount > 0 ? `${karyawanCount} terapis aktif` : "tim terapis bersertifikat"}.`],
  ];
  return (
    <div>
      <div className="grain relative overflow-hidden bg-gradient-to-br from-sage-800 via-sage-900 to-sage-950 py-16 text-white">
        <div className="pointer-events-none absolute -left-20 top-10 h-64 w-64 rounded-full bg-gold-400/15 blur-3xl" />
        <div className="relative mx-auto max-w-4xl px-4 text-center">
          <Reveal>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-gold-300">Tentang Kami</p>
            <h1 className="font-serif-display mt-3 text-4xl font-bold md:text-5xl">Tempat tenang untuk <span className="italic text-gold-300">merawat diri</span></h1>
            <p className="mx-auto mt-4 max-w-2xl text-white/70">Edelweiss terinspirasi bunga abadi — cantik yang tahan lama karena dirawat dengan benar, bukan instan.</p>
          </Reveal>
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-4 py-14">
        <SectionHeading eyebrow="Nilai Kami" title="Kenapa pelanggan betah?" />
        <div className="mt-8 grid gap-4 md:grid-cols-4">
          {values.map((v, k) => (
            <Reveal key={v.t} delay={k * 0.07}>
              <div className="card-lift h-full rounded-3xl border border-stone-200/70 bg-white p-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sage-700 text-white"><v.icon size={20} /></span>
                <p className="mt-3 font-bold text-sage-900">{v.t}</p>
                <p className="mt-1 text-sm text-stone-500">{v.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
        <div className="mt-14">
          <SectionHeading eyebrow="Perjalanan" title="Cerita Edelweiss" />
          <div className="relative mt-8 border-l-2 border-sage-200 pl-6">
            {timeline.map(([y, t, d], k) => (
              <Reveal key={y} delay={k * 0.06}>
                <div className="relative pb-8 last:pb-0">
                  <span className="absolute -left-[33px] flex h-4 w-4 items-center justify-center rounded-full bg-gold-400 ring-4 ring-cream-100" />
                  <p className="font-serif-display text-2xl font-bold text-sage-800">{y}</p>
                  <p className="font-semibold">{t}</p>
                  <p className="text-sm text-stone-500">{d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
