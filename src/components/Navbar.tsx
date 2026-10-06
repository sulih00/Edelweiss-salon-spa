"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Home" },
  { href: "/tentang", label: "Tentang" },
  { href: "/layanan", label: "Layanan" },
  { href: "/promo", label: "Promo" },
  { href: "/galeri", label: "Galeri" },
  { href: "/testimoni", label: "Testimoni" },
  { href: "/kontak", label: "Kontak" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const path = usePathname();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 12);
    fn();
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-all duration-300",
        scrolled ? "bg-[#fdfbf7]/85 shadow-[0_8px_30px_-12px_rgba(34,48,31,0.25)] backdrop-blur-xl" : "bg-[#fdfbf7]/60 backdrop-blur"
      )}
    >
      <div className="border-b border-sage-100">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/" className="group flex items-center gap-3">
            <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full border border-gold-400/50 bg-white shadow-md shadow-sage-700/15 transition-transform duration-300 group-hover:scale-105">
              <Image
                src="/logo.png"
                alt="Edelweiss Salon Logo"
                fill
                sizes="44px"
                className="object-cover"
                priority
              />
            </div>
            <span className="leading-tight">
              <span className="font-serif-display block text-xl font-bold text-sage-800">Edelweiss</span>
              <span className="block text-[10px] tracking-[0.3em] font-medium text-gold-600">SALON • MAKEUP ART</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm md:flex">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={cn("link-underline text-stone-600 hover:text-sage-800", path === l.href && "active font-semibold text-sage-800")}
              >
                {l.label}
              </Link>
            ))}
            <Link
              href="/booking"
              className="group relative overflow-hidden rounded-full bg-sage-700 px-6 py-2.5 font-medium text-white shadow-lg shadow-sage-700/25 transition hover:bg-sage-800"
            >
              <span className="relative z-10">Booking ✨</span>
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            </Link>
          </nav>
          <div className="flex items-center gap-2 md:hidden">
            <Link href="/booking" className="rounded-full bg-sage-700 px-4 py-2 text-sm font-medium text-white">
              Booking
            </Link>
            <button onClick={() => setOpen(!open)} className="rounded-full border border-sage-200 p-2 text-sage-800" aria-label="menu">
              {open ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </div>
      {open && (
        <nav className="animate-bloom border-b border-sage-100 bg-[#fdfbf7] px-4 py-3 md:hidden">
          <div className="grid gap-1">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "rounded-xl px-3 py-2.5 text-sm transition",
                  path === l.href ? "bg-sage-700 font-semibold text-white" : "text-stone-600 hover:bg-sage-50"
                )}
              >
                {l.label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
