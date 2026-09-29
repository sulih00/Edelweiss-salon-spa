import { Reveal } from "@/components/motion";
import { Clock, MessageCircle, MapPin, Navigation } from "lucide-react";
import { SOSMED } from "@/lib/sosmed";
import { IconInstagram, IconTikTok, IconWhatsApp } from "@/components/SocialIcons";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kontak & Lokasi",
  description: "Hubungi Edelweiss Salon Spa via WhatsApp, kunjungi outlet kami, atau lihat jam operasional. Buka setiap hari 09.00–20.00.",
};

export const dynamic = "force-dynamic";

export default async function Kontak() {
  const lokasi =
    (await prisma.lokasi.findFirst({ where: { utama: true } })) ??
    (await prisma.lokasi.findFirst({ orderBy: { createdAt: "asc" } }));

  const lat = lokasi?.lat ?? -6.2088;
  const lon = lokasi?.lon ?? 106.8456;
  const zoom = lokasi?.zoom ?? 16;
  const namaLokasi = lokasi?.nama ?? "Edelweiss Salon & Spa";
  const alamatLokasi = lokasi?.alamat;

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
                  {c.href && (
                    <a href={c.href} target="_blank" rel="noreferrer" className="mt-1.5 inline-flex items-center gap-1 text-sm font-semibold text-sage-700 hover:underline">
                      <MessageCircle size={14} /> Buka / Hubungi
                    </a>
                  )}
                </div>
              </div>
            ))}

            {alamatLokasi && (
              <div className="card-lift flex items-start gap-4 rounded-3xl border border-stone-200/70 bg-white p-5 shadow-sm">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sage-800 text-gold-300 shadow-md">
                  <MapPin size={20} />
                </span>
                <div>
                  <p className="font-bold text-sage-900">{namaLokasi}</p>
                  <p className="text-sm text-stone-500">{alamatLokasi}</p>
                  <span className="mt-1 block font-mono text-xs text-stone-400">
                    Koordinat: {lat}, {lon}
                  </span>
                </div>
              </div>
            )}
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="flex flex-col h-full min-h-[420px] overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-lg">
            <div className="relative flex-1 min-h-[360px]">
              <iframe
                title="maps"
                src={`https://maps.google.com/maps?q=${lat},${lon}&z=${zoom}&output=embed`}
                className="absolute inset-0 h-full w-full border-0 grayscale-[15%] transition hover:grayscale-0"
                loading="lazy"
              />
            </div>
            <div className="flex items-center justify-between border-t border-stone-100 bg-stone-50/80 px-5 py-3">
              <div className="flex items-center gap-2 text-xs font-medium text-stone-600">
                <MapPin size={15} className="text-sage-700" />
                <span className="truncate">{namaLokasi}</span>
              </div>
              <a
                href={`https://www.google.com/maps?q=${lat},${lon}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full bg-sage-800 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-sage-900"
              >
                <Navigation size={13} /> Petunjuk Arah Google Maps
              </a>
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
