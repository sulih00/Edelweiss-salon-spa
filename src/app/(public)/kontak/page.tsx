import { Reveal } from "@/components/motion";
import { Clock, MessageCircle } from "lucide-react";
import { SOSMED } from "@/lib/sosmed";
import { IconInstagram, IconTikTok, IconWhatsApp } from "@/components/SocialIcons";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kontak & Lokasi",
  description: "Hubungi Edelweiss Salon Spa via WhatsApp, kunjungi outlet kami, atau lihat jam operasional. Buka setiap hari 09.00–20.00.",
};

export default function Kontak() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <Reveal>
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-gold-500">Kontak & Lokasi</p>
        <h1 className="font-serif-display mt-2 text-4xl font-bold text-sage-900 md:text-5xl">Mampir, konsultasi gratis</h1>
      </Reveal>
      <div className="mt-8 grid gap-5 md:grid-cols-2">
        <Reveal>
          <div className="grid gap-4">
            {[
              {
                icon: <IconWhatsApp className="h-5 w-5 text-white" />,
                t: "WhatsApp",
                d: `${SOSMED.waFormatted} — fast respon 09.00–20.00`,
                href: `https://wa.me/${SOSMED.wa}`,
                badgeBg: "bg-[#25D366]",
              },
              {
                icon: <IconInstagram className="h-5 w-5 text-white" />,
                t: "Instagram",
                d: `${SOSMED.instagramHandle} — lihat hasil & promo`,
                href: SOSMED.instagram,
                badgeBg: "bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600",
              },
              {
                icon: <IconTikTok className="h-5 w-5 text-white" />,
                t: "TikTok",
                d: `${SOSMED.tiktokHandle} — video treatment & tutorial`,
                href: SOSMED.tiktok,
                badgeBg: "bg-black",
              },
              {
                icon: <Clock className="h-5 w-5 text-white" />,
                t: "Jam Operasional",
                d: "Setiap hari 09.00 – 20.00 (last order 19.00)",
                badgeBg: "bg-sage-700",
              },
            ].map((c) => (
              <div key={c.t} className="card-lift flex items-start gap-4 rounded-3xl border border-stone-200/70 bg-white p-5 shadow-sm">
                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl shadow-md ${c.badgeBg}`}>{c.icon}</span>
                <div>
                  <p className="font-bold text-sage-900">{c.t}</p>
                  <p className="text-sm text-stone-500">{c.d}</p>
                  {c.href && <a href={c.href} target="_blank" rel="noreferrer" className="mt-1.5 inline-flex items-center gap-1 text-sm font-semibold text-sage-700 hover:underline"><MessageCircle size={14} /> Buka / Hubungi</a>}
                </div>
              </div>
            ))}
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="h-full min-h-[380px] overflow-hidden rounded-3xl border border-stone-200 shadow-lg">
            <iframe title="maps" src="https://www.google.com/maps?q=salon+spa&output=embed" className="h-full min-h-[380px] w-full grayscale-[25%] transition hover:grayscale-0" />
          </div>
        </Reveal>
      </div>
    </div>
  );
}
