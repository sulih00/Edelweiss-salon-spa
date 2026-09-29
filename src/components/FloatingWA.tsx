"use client";
import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { WA_ADMIN } from "@/lib/wa";
import { IconWhatsApp } from "./SocialIcons";

export default function FloatingWA() {
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const fn = () => setShowTop(window.scrollY > 400);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Scroll to Top */}
      {showTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-stone-200/80 bg-white/90 text-stone-600 shadow-md backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:bg-white hover:text-sage-800 hover:shadow-lg"
          aria-label="Kembali ke atas"
        >
          <ArrowUp size={16} />
        </button>
      )}

      {/* Floating WhatsApp Button */}
      <a
        href={`https://wa.me/${WA_ADMIN}?text=${encodeURIComponent("Halo Edelweiss Salon Spa! Saya mau tanya ketersediaan slot treatment hari ini.")}`}
        target="_blank"
        rel="noreferrer"
        aria-label="Chat WhatsApp"
        className="group relative flex items-center gap-3.5 rounded-full bg-gradient-to-r from-[#25D366] to-[#128C7E] p-3.5 text-white shadow-xl shadow-green-600/35 transition-all duration-300 hover:-translate-y-1 hover:scale-105 hover:shadow-2xl hover:shadow-green-600/45"
      >
        {/* Animated Ping Indicator */}
        <span className="absolute -left-1 -top-1 flex h-4 w-4">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex h-4 w-4 rounded-full bg-green-400 ring-2 ring-white" />
        </span>

        {/* WhatsApp Vector Icon */}
        <IconWhatsApp className="h-6 w-6 shrink-0 text-white drop-shadow-sm transition-transform duration-300 group-hover:scale-110" />

        {/* Text Label */}
        <span className="max-w-0 overflow-hidden whitespace-nowrap text-sm font-bold opacity-0 transition-all duration-300 group-hover:max-w-xs group-hover:opacity-100 sm:max-w-none sm:opacity-100 pr-1">
          Chat WhatsApp
        </span>
      </a>
    </div>
  );
}
