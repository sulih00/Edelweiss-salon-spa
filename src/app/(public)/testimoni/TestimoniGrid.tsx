"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

export default function TestimoniGrid({ data }: { data: { id: string; nama: string; isi: string; rating: number }[] }) {
  const [filter, setFilter] = useState(0);
  const shown = filter === 0 ? data : data.filter((d) => d.rating === filter);
  const avg = data.length ? (data.reduce((a, b) => a + b.rating, 0) / data.length).toFixed(1) : "-";

  return (
    <div>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 rounded-full bg-sage-800 px-5 py-2.5 text-white">
          <Star size={16} className="text-gold-300" fill="currentColor" />
          <b>{avg}</b> <span className="text-sm text-white/70">dari {data.length} ulasan</span>
        </div>
        <div className="flex gap-2">
          {[0, 5, 4, 3].map((r) => (
            <button key={r} onClick={() => setFilter(r)} className={`rounded-full px-4 py-2 text-xs font-semibold transition ${filter === r ? "bg-gold-400 text-sage-900" : "border border-stone-200 bg-white text-stone-500 hover:border-gold-400"}`}>
              {r === 0 ? "Semua" : `${r} ★`}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {shown.map((t, k) => (
          <motion.div key={t.id} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: (k % 4) * 0.06 }} className="card-lift rounded-3xl border border-stone-200/70 bg-white p-6">
            <Quote size={22} className="text-gold-400" />
            <p className="mt-2 leading-relaxed text-stone-700">“{t.isi}”</p>
            <div className="mt-4 flex items-center justify-between">
              <p className="font-bold text-sage-900">— {t.nama}</p>
              <div className="flex gap-0.5 text-gold-500">{Array.from({ length: t.rating }).map((_, i) => <Star key={i} size={13} fill="currentColor" />)}</div>
            </div>
          </motion.div>
        ))}
      </div>
      {shown.length === 0 && <p className="mt-8 text-center text-stone-400">Belum ada ulasan dengan filter ini.</p>}
    </div>
  );
}
