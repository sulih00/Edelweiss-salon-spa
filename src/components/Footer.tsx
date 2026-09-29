import Link from "next/link";
import Image from "next/image";
import { Clock, ArrowUpRight } from "lucide-react";
import { SOSMED } from "@/lib/sosmed";
import { IconInstagram, IconTikTok, IconWhatsApp } from "./SocialIcons";

export default function Footer() {
  return (
    <footer className="relative overflow-hidden bg-sage-900 text-sage-100">
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-gold-400/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-sage-600/30 blur-3xl" />
      <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-[1.3fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-3">
            <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full border border-gold-300/40 bg-white shadow-md">
              <Image
                src="/logo.png"
                alt="Edelweiss Salon Logo"
                fill
                sizes="44px"
                className="object-cover"
              />
            </div>
            <div>
              <p className="font-serif-display text-2xl font-bold text-white">Edelweiss</p>
              <p className="text-[10px] tracking-[0.3em] text-gold-300">SALON • SPA</p>
            </div>
          </div>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-sage-100/75">
            Ritual cantik & rileks dalam satu tempat yang tenang — hair studio, body spa, facial, dan nail art dengan terapis bersertifikat.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href="/booking" className="rounded-full bg-gold-400 px-5 py-2.5 text-sm font-semibold text-sage-900 transition hover:-translate-y-0.5 hover:bg-gold-300 shadow-md">
              Booking Sekarang ✨
            </Link>
            <a
              href={SOSMED.instagram}
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram Edelweiss"
              className="flex items-center gap-1.5 rounded-full border border-white/20 bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition hover:-translate-y-0.5 hover:bg-gradient-to-r hover:from-purple-600 hover:to-pink-500 hover:border-transparent shadow-sm"
            >
              <IconInstagram className="h-4 w-4" /> IG <ArrowUpRight size={13} className="opacity-70" />
            </a>
            <a
              href={SOSMED.tiktok}
              target="_blank"
              rel="noreferrer"
              aria-label="TikTok Edelweiss"
              className="flex items-center gap-1.5 rounded-full border border-white/20 bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition hover:-translate-y-0.5 hover:bg-black hover:border-transparent shadow-sm"
            >
              <IconTikTok className="h-4 w-4" /> TikTok <ArrowUpRight size={13} className="opacity-70" />
            </a>
          </div>
        </div>
        <div className="text-sm">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-gold-300">Kunjungi Kami</p>
          <a href={`https://wa.me/${SOSMED.wa}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 transition hover:text-green-400">
            <IconWhatsApp className="h-4 w-4 text-green-400" /> {SOSMED.waFormatted} (WA)
          </a>
          <a href={SOSMED.instagram} target="_blank" rel="noreferrer" className="mt-2 flex items-center gap-2 transition hover:text-gold-300">
            <IconInstagram className="h-4 w-4 text-gold-300" /> {SOSMED.instagramHandle}
          </a>
          <a href={SOSMED.tiktok} target="_blank" rel="noreferrer" className="mt-2 flex items-center gap-2 transition hover:text-gold-300">
            <IconTikTok className="h-4 w-4 text-gold-300" /> {SOSMED.tiktokHandle}
          </a>
          <p className="mt-2.5 flex items-center gap-2 text-stone-300"><Clock size={14} className="text-gold-300" /> Setiap hari 09.00 – 20.00</p>
        </div>
        <div className="text-sm">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-gold-300">Jelajah</p>
          <ul className="grid gap-2">
            {[["/layanan", "Layanan & Harga"], ["/promo", "Promo"], ["/galeri", "Galeri"], ["/testimoni", "Testimoni"], ["/booking", "Booking Online"], ["/kontak", "Kontak"]].map(([h, l]) => (
              <li key={h}><Link href={h} className="text-sage-100/75 transition hover:text-white">{l}</Link></li>
            ))}
          </ul>
        </div>
      </div>
      <div className="relative border-t border-white/10 py-4 text-center text-xs text-sage-100/50">
        © {new Date().getFullYear()} Edelweiss Salon Spa — crafted with calm 🌿
      </div>
    </footer>
  );
}
