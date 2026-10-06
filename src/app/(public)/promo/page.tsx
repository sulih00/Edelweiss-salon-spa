import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { safeDb } from "@/lib/safe-db";
import { labelPromo } from "@/lib/promo";
import { Reveal } from "@/components/motion";
import { TicketPercent, ArrowRight } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Promo",
  description: "Promo Edelweiss Salon Makeup Art: diskon treatment, potongan paket bride. Catat kodenya dan pakai saat booking online.",
};

export const dynamic = "force-dynamic";

export default async function PromoPage() {
  const now = new Date();
  const all = await safeDb(
    () =>
      prisma.promo.findMany({
        where: { aktif: true, mulai: { lte: now }, OR: [{ berakhir: null }, { berakhir: { gte: now } }] },
        orderBy: { createdAt: "desc" },
      }),
    []
  );
  const data = all.filter((p) => p.kuota == null || p.terpakai < p.kuota);

  return (
    <div>
      <div className="grain relative overflow-hidden bg-gradient-to-br from-sage-800 to-sage-950 py-14 text-white">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gold-400/20 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-4">
          <Reveal>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-gold-300">Hemat Lebih</p>
            <h1 className="font-serif-display mt-2 text-4xl font-bold md:text-5xl">Promo Edelweiss</h1>
            <p className="mt-2 max-w-xl text-sm text-white/70">Catat kodenya, masukkan saat booking online — diskon otomatis memotong tagihan.</p>
          </Reveal>
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-5 md:grid-cols-3">
          {data.map((p, k) => (
            <Reveal key={p.id} delay={k * 0.06}>
              <div className="card-lift relative overflow-hidden rounded-3xl border border-gold-400/40 bg-white p-6">
                <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-gold-400/20 blur-2xl" />
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sage-700 text-white"><TicketPercent size={20} /></span>
                <p className="mt-4 inline-block rounded-lg border-2 border-dashed border-gold-400 bg-gold-400/10 px-3 py-1 font-mono text-sm font-bold tracking-widest text-sage-800">{p.kode}</p>
                <p className="font-serif-display mt-2 text-xl font-bold text-sage-900">{p.nama}</p>
                <p className="mt-1 text-sm text-stone-500">{p.deskripsi}</p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="rounded-full bg-sage-700 px-3 py-1 text-xs font-bold text-white">Hemat {labelPromo(p)}</span>
                  <Link href="/booking" className="group flex items-center gap-1 text-sm font-semibold text-sage-700">Pakai <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" /></Link>
                </div>
                <p className="mt-2 text-[11px] text-stone-400">
                  {p.minBelanja > 0 && <>Min Rp {p.minBelanja.toLocaleString("id-ID")} • </>}
                  {p.berakhir ? <>Berlaku s/d {new Date(p.berakhir).toLocaleDateString("id-ID", { timeZone: "Asia/Jakarta" })}</> : <>Tanpa batas waktu</>}
                  {p.kuota ? <> • sisa {p.kuota - p.terpakai}</> : null}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
        {data.length === 0 && <p className="mt-8 text-center text-stone-400">Belum ada promo aktif — pantau Instagram kami untuk kejutan.</p>}
      </div>
    </div>
  );
}
