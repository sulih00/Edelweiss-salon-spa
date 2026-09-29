"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ArrowRight } from "lucide-react";
import { rupiah } from "@/lib/utils";
import { Pagination } from "@/components/admin";

type Item = { id: string; nama: string; harga: number; durasiMenit: number; stok: number; isLayanan: boolean; deskripsi?: string | null; foto?: string | null; kategori: { nama: string } };

export default function LayananClient({ data }: { data: Item[] }) {
  const [q, setQ] = useState("");
  const [kat, setKat] = useState("Semua");
  const [page, setPage] = useState(1);
  const pageSize = 9;

  const cats = useMemo(() => ["Semua", ...Array.from(new Set(data.map((d) => d.kategori.nama)))], [data]);

  const filtered = useMemo(() => {
    return data.filter(
      (d) => (kat === "Semua" || d.kategori.nama === kat) && (d.nama.toLowerCase().includes(q.toLowerCase()) || (d.deskripsi ?? "").toLowerCase().includes(q.toLowerCase()))
    );
  }, [data, kat, q]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = useMemo(() => {
    return filtered.slice((page - 1) * pageSize, page * pageSize);
  }, [filtered, page, pageSize]);

  return (
    <div>
      <div className="sticky top-[65px] z-30 -mx-4 border-b border-sage-100 bg-[#fdfbf7]/90 px-4 py-3 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
            <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Cari creambath, facial, massage..." className="w-full rounded-full border border-stone-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-sage-600 focus:ring-4 focus:ring-sage-100" />
          </div>
          <div className="no-scrollbar flex gap-2 overflow-x-auto">
            {cats.map((c) => (
              <button key={c} onClick={() => { setKat(c); setPage(1); }} className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold transition ${kat === c ? "bg-sage-700 text-white shadow-lg shadow-sage-700/25" : "border border-stone-200 bg-white text-stone-600 hover:border-sage-600"}`}>
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-10">
        <p className="text-sm text-stone-500">{filtered.length} layanan ditemukan{kat !== "Semua" && <> di <b>{kat}</b></>}</p>
        <motion.div layout className="mt-5 grid gap-5 md:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {paginated.map((l) => (
              <motion.div key={l.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.25 }}>
                <Link href={`/booking?layanan=${l.id}`} className="card-lift group block overflow-hidden rounded-3xl border border-stone-200/80 bg-white">
                  <div className="relative h-48 overflow-hidden bg-sage-100">
                    {l.foto ? (
                      <Image
                        src={l.foto}
                        alt={l.nama}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        loading="lazy"
                        className="object-cover transition duration-700 group-hover:scale-110"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-gradient-to-br from-sage-100 to-cream-200"><span className="font-serif-display text-2xl italic text-sage-700">{l.nama.slice(0, 1)}</span></div>
                    )}
                    <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-sage-700 backdrop-blur">
                      {l.isLayanan ? `${l.durasiMenit} mnt` : `stok ${l.stok}`}
                    </span>
                  </div>
                  <div className="p-5">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-gold-500">{l.kategori.nama}</p>
                    <p className="font-serif-display mt-1 text-xl font-bold text-sage-900">{l.nama}</p>
                    <p className="mt-1 line-clamp-2 min-h-[2.5rem] text-sm text-stone-500">{l.deskripsi}</p>
                    <div className="mt-3 flex items-center justify-between">
                      <p className="font-bold text-sage-700">{rupiah(l.harga)}</p>
                      <span className="flex items-center gap-1 rounded-full bg-sage-700 px-4 py-2 text-xs font-semibold text-white transition group-hover:bg-gold-500">Pilih <ArrowRight size={13} /></span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={(p) => { setPage(p); window.scrollTo({ top: 200, behavior: "smooth" }); }}
          totalItems={filtered.length}
          pageSize={pageSize}
        />

        {filtered.length === 0 && <p className="mt-10 text-center text-stone-400">Tidak ketemu — coba kata kunci lain.</p>}
      </div>
    </div>
  );
}

