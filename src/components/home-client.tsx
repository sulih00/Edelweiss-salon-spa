"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Plus, Minus, Star } from "lucide-react";

export function TestimonialCarousel({ data }: { data: { id: string; nama: string; isi: string; rating: number }[] }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused || data.length < 2) return;
    const t = setInterval(() => setI((v) => (v + 1) % data.length), 4500);
    return () => clearInterval(t);
  }, [paused, data.length]);
  if (data.length === 0) return <p className="text-white/60">Belum ada testimoni.</p>;
  const t = data[i];
  return (
    <div onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} className="relative">
      <div className="min-h-[190px] rounded-3xl border border-white/15 bg-white/10 p-7 backdrop-blur">
        <AnimatePresence mode="wait">
          <motion.div key={t.id} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.35 }}>
            <div className="flex gap-1 text-gold-300">
              {Array.from({ length: t.rating }).map((_, k) => <Star key={k} size={15} fill="currentColor" />)}
            </div>
            <p className="font-serif-display mt-3 text-xl leading-relaxed text-white md:text-2xl">“{t.isi}”</p>
            <p className="mt-4 text-sm font-semibold tracking-wide text-gold-300">— {t.nama}</p>
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <div className="flex gap-1.5">
          {data.map((d, k) => (
            <button key={d.id} onClick={() => setI(k)} aria-label={`slide ${k}`} className={`h-2 rounded-full transition-all ${k === i ? "w-8 bg-gold-300" : "w-2 bg-white/30 hover:bg-white/60"}`} />
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={() => setI((i - 1 + data.length) % data.length)} className="rounded-full border border-white/25 p-2.5 text-white transition hover:bg-white/15" aria-label="prev"><ChevronLeft size={17} /></button>
          <button onClick={() => setI((i + 1) % data.length)} className="rounded-full border border-white/25 p-2.5 text-white transition hover:bg-white/15" aria-label="next"><ChevronRight size={17} /></button>
        </div>
      </div>
    </div>
  );
}

export function Faq({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="grid gap-3">
      {items.map((f, k) => {
        const isOpen = open === k;
        return (
          <div key={k} className={`overflow-hidden rounded-2xl border transition ${isOpen ? "border-sage-600 bg-white shadow-lg shadow-sage-700/10" : "border-stone-200 bg-white/70"}`}>
            <button onClick={() => setOpen(isOpen ? null : k)} className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left">
              <span className="font-semibold text-sage-900">{f.q}</span>
              <span className={`rounded-full p-1.5 transition ${isOpen ? "bg-sage-700 text-white" : "bg-sage-50 text-sage-700"}`}>
                {isOpen ? <Minus size={15} /> : <Plus size={15} />}
              </span>
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }}>
                  <p className="px-5 pb-5 text-sm leading-relaxed text-stone-600">{f.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
