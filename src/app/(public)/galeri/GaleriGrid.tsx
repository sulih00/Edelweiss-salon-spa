"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

export default function GaleriGrid({ data }: { data: { id: string; foto: string; judul?: string | null }[] }) {
  const [idx, setIdx] = useState<number | null>(null);
  return (
    <>
      <div className="mt-8 columns-2 gap-4 md:columns-3 [&>div]:mb-4">
        {data.map((g, k) => (
          <motion.div key={g.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: (k % 6) * 0.05 }} className="group relative cursor-zoom-in overflow-hidden rounded-2xl break-inside-avoid" onClick={() => setIdx(k)}>
            {g.foto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={g.foto} alt={g.judul ?? ""} className="w-full object-cover transition duration-700 group-hover:scale-108" loading="lazy" />
            ) : (
              <div className="flex h-48 items-center justify-center bg-sage-100"><p className="font-serif-display">{g.judul}</p></div>
            )}
            <div className="absolute inset-0 flex items-end bg-gradient-to-t from-sage-900/70 via-transparent to-transparent p-4 opacity-0 transition group-hover:opacity-100">
              <p className="text-sm font-semibold text-white">{g.judul ?? "Edelweiss"}</p>
            </div>
          </motion.div>
        ))}
      </div>
      {data.length === 0 && <p className="mt-8 text-center text-stone-400">Galeri segera hadir.</p>}

      <AnimatePresence>
        {idx !== null && data[idx] && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-center justify-center bg-sage-950/90 p-4 backdrop-blur" onClick={() => setIdx(null)}>
            <button className="absolute right-5 top-5 rounded-full bg-white/15 p-2.5 text-white hover:bg-white/30" aria-label="tutup"><X size={20} /></button>
            <button onClick={(e) => { e.stopPropagation(); setIdx((idx - 1 + data.length) % data.length); }} className="absolute left-4 rounded-full bg-white/15 p-3 text-white hover:bg-white/30" aria-label="prev"><ChevronLeft size={20} /></button>
            <motion.div initial={{ scale: 0.92 }} animate={{ scale: 1 }} className="max-h-[85vh] max-w-3xl overflow-hidden rounded-2xl" onClick={(e) => e.stopPropagation()}>
              {data[idx].foto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={data[idx].foto} alt="" className="max-h-[75vh] w-full object-contain bg-black" />
              ) : null}
              <p className="bg-white px-5 py-3 text-sm font-semibold">{data[idx].judul} <span className="text-stone-400">({idx + 1}/{data.length})</span></p>
            </motion.div>
            <button onClick={(e) => { e.stopPropagation(); setIdx((idx + 1) % data.length); }} className="absolute right-4 rounded-full bg-white/15 p-3 text-white hover:bg-white/30" aria-label="next"><ChevronRight size={20} /></button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
