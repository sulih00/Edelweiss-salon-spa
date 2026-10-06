import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { safeDb } from "@/lib/safe-db";
import type { Produk, KategoriProduk, Testimoni, Galeri, Promo } from "@prisma/client";
import { rupiah } from "@/lib/utils";
import { Reveal, SectionHeading } from "@/components/motion";
import { TestimonialCarousel, Faq } from "@/components/home-client";
import { Sparkles, Scissors, Flower2, Star, ArrowRight, BadgeCheck, Leaf, Clock, TicketPercent } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function Home() {
  const now = new Date();
  // 1 round-trip DB: semua query jalan paralel, bukan 6x berurutan.
  type HomeData = [
    { nama: string }[],
    (Produk & { kategori: KategoriProduk })[],
    Testimoni[],
    Galeri[],
    number,
    Promo[]
  ];
  const [dbKategori, layanan, testimoni, galeri, bookingCount, promoAktif] = await safeDb<HomeData>(
    () =>
      Promise.all([
        prisma.kategoriProduk.findMany({ select: { nama: true } }),
        prisma.produk.findMany({
          where: { aktif: true, isLayanan: true },
          include: { kategori: true },
          take: 6,
          orderBy: { createdAt: "desc" },
        }),
        prisma.testimoni.findMany({ where: { tampil: true }, take: 6 }),
        prisma.galeri.findMany({ where: { tampil: true }, take: 4 }),
        prisma.booking.count(),
        prisma.promo.findMany({
          where: { aktif: true, mulai: { lte: now }, OR: [{ berakhir: null }, { berakhir: { gte: now } }] },
          take: 3,
          orderBy: { createdAt: "desc" },
        }),
      ]) as unknown as Promise<HomeData>,
    [[], [], [], [], 0, []]
  );
  const marqueeItems = dbKategori.length > 0
    ? dbKategori.map((k) => k.nama)
    : ["Hair Studio", "Body Massage", "Facial Brightening", "Creambath", "Manicure Pedicure", "Paket Bride"];

  const faqs = [
    { q: "Apakah harus booking dulu atau bisa walk-in?", a: "Bisa keduanya. Tapi weekend biasanya penuh — booking online 1 hari sebelumnya sangat disarankan agar tidak antre." },
    { q: "Apakah perlu DP?", a: "Treatment di bawah Rp 300rb tanpa DP. Paket bride / treatment di atas Rp 300rb cukup DP 30% via transfer atau kasir." },
    { q: "Produk yang dipakai aman?", a: "Ya, kami memakai produk ber-BPOM dan bahan alami pilihan. Beri tahu kami jika ada alergi agar terapis menyesuaikan." },
    { q: "Berapa lama treatment?", a: "Haircut 45 menit, creambath 60 menit, massage 60–90 menit, facial 75 menit. Estimasi durasi selalu tertera di setiap layanan." },
  ];

  const promos = promoAktif.filter((p) => p.kuota == null || p.terpakai < p.kuota);

  const bestSeller = layanan[0];

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BeautySalon",
            name: "Edelweiss Salon Makeup Art",
            description: "Hair studio, body massage, facial & nail art. Terapis bersertifikat, booking online mudah.",
            telephone: "+62-857-2881-8103",
            address: { "@type": "PostalAddress", streetAddress: "Jl. Mawar No. 12", addressLocality: "Kota Anda", addressCountry: "ID" },
            openingHours: "Mo-Su 09:00-20:00",
            priceRange: "Rp 75.000 - Rp 750.000",
            aggregateRating: { "@type": "AggregateRating", ratingValue: "4.9", reviewCount: String(Math.max(testimoni.length, 1) * 267) },
          }),
        }}
      />
      {/* HERO */}
      <section className="grain relative overflow-hidden bg-gradient-to-br from-sage-100 via-cream-100 to-cream-50">
        <div className="pointer-events-none absolute -left-32 top-10 h-96 w-96 rounded-full bg-sage-200/50 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-gold-400/25 blur-3xl" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 pb-16 pt-12 md:grid-cols-2 md:pt-20">
          <div>
            <Reveal>
              <p className="inline-flex items-center gap-2 rounded-full border border-sage-200 bg-white/80 px-4 py-1.5 text-xs font-semibold text-sage-700 shadow-sm backdrop-blur">
                <span className="relative flex h-2 w-2"><span className="absolute h-full w-full animate-ping rounded-full bg-sage-600 opacity-60" /><span className="relative h-2 w-2 rounded-full bg-sage-600" /></span>
                Salon & Makeup Art — slot hari ini tersedia
              </p>
            </Reveal>
            <Reveal delay={0.1}>
              <h1 className="font-serif-display mt-5 text-4xl font-bold leading-[1.1] text-sage-900 md:text-6xl">
                Cantik natural,<br />badan <span className="text-shimmer italic">rileks</span>,<br />hati tenang.
              </h1>
            </Reveal>
            <Reveal delay={0.2}>
              <p className="mt-5 max-w-md leading-relaxed text-stone-600">
                Edelweiss Salon Makeup Art: hair studio, body massage, facial, dan nail art. Terapis bersertifikat, aroma terapi, dan ruangan yang bikin betah.
              </p>
            </Reveal>
            <Reveal delay={0.3}>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/booking" className="group flex items-center gap-2 rounded-full bg-sage-700 px-7 py-3.5 text-sm font-semibold text-white shadow-xl shadow-sage-700/30 transition hover:-translate-y-0.5 hover:bg-sage-800">
                  Booking Sekarang <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                </Link>
                <Link href="/layanan" className="rounded-full border border-sage-700/40 bg-white/60 px-7 py-3.5 text-sm font-semibold text-sage-800 backdrop-blur transition hover:bg-white">
                  Lihat Layanan & Harga
                </Link>
              </div>
            </Reveal>
            <Reveal delay={0.4}>
              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-stone-600">
                <span className="flex items-center gap-1.5"><Star size={15} className="text-gold-500" fill="currentColor" /> <b>4.9</b> dari 800+ ulasan</span>
                <span className="flex items-center gap-1.5"><BadgeCheck size={15} className="text-sage-600" /> Terapis bersertifikat</span>
                <span className="flex items-center gap-1.5"><Clock size={15} className="text-sage-600" /> 09.00–20.00 tiap hari</span>
              </div>
            </Reveal>
          </div>

          <div className="relative">
            <Reveal delay={0.2} className="relative">
              <div className="overflow-hidden rounded-[2rem] border-4 border-white shadow-2xl shadow-sage-900/20">
                {galeri[0]?.foto ? (
                  <div className="relative h-[420px] w-full">
                    <Image
                      src={galeri[0].foto}
                      alt="Studio Makeup Art Edelweiss Salon Makeup Art"
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover transition duration-700 hover:scale-105"
                      priority
                    />
                  </div>
                ) : (
                  <div className="flex h-[420px] flex-col items-center justify-center gap-3 bg-gradient-to-br from-sage-700 via-sage-800 to-sage-900 text-white">
                    <Flower2 size={48} className="text-gold-300" />
                    <p className="font-serif-display text-3xl italic">Studio Makeup Art Edelweiss</p>
                    <p className="text-sm text-white/70">Tenang • Wangi • Bersih</p>
                  </div>
                )}
              </div>
              <div className="animate-floaty absolute -left-4 top-8 rounded-2xl border border-white/60 bg-white/90 px-4 py-3 shadow-xl backdrop-blur">
                <p className="text-[11px] font-bold uppercase tracking-wider text-gold-600">Layanan Populer</p>
                <p className="font-serif-display font-bold text-sage-900">{bestSeller?.nama ?? "Creambath Edelweiss"}</p>
                <p className="text-xs text-stone-500">{bestSeller ? `${bestSeller.durasiMenit} mnt • ${bestSeller.kategori.nama}` : "60 mnt • pijat kepala"}</p>
              </div>
              <div className="animate-floaty-slow absolute -right-3 bottom-8 rounded-2xl border border-white/60 bg-white/90 px-4 py-3 shadow-xl backdrop-blur">
                <p className="flex items-center gap-1 text-sm font-bold text-sage-800"><Leaf size={14} /> {bookingCount > 0 ? `${bookingCount}+ treatment` : "5.000+ treatment"}</p>
                <p className="text-xs text-stone-500">pelanggan puas & kembali</p>
              </div>
            </Reveal>
          </div>
        </div>

        {/* marquee */}
        <div className="relative border-y border-sage-800 bg-sage-800 py-3.5 text-cream-100">
          <div className="flex overflow-hidden">
            <div className="animate-marquee flex shrink-0 items-center gap-8 pr-8">
              {[...marqueeItems, ...marqueeItems].map((m, k) => (
                <span key={k} className="flex items-center gap-8 whitespace-nowrap text-sm font-medium tracking-wide">
                  {m} <Sparkles size={14} className="text-gold-300" />
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* PROMO */}
      {promos.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pt-14">
          <Reveal>
            <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-r from-sage-800 via-sage-900 to-sage-950 p-7 text-white md:p-9">
              <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-gold-400/25 blur-3xl" />
              <div className="relative flex flex-wrap items-center justify-between gap-5">
                <div>
                  <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.3em] text-gold-300"><TicketPercent size={15} /> Promo spesial</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {promos.map((p) => (
                      <span key={p.id} className="rounded-lg border-2 border-dashed border-gold-300/70 bg-white/10 px-3 py-1.5 font-mono text-sm font-bold tracking-widest">{p.kode}</span>
                    ))}
                  </div>
                  <p className="mt-2 text-sm text-white/70">{promos[0].nama}{promos.length > 1 && ` +${promos.length - 1} promo lainnya`} — masukkan kode saat booking.</p>
                </div>
                <Link href="/promo" className="rounded-full bg-gold-400 px-6 py-3 text-sm font-bold text-sage-900 transition hover:-translate-y-0.5 hover:bg-gold-300">
                  Lihat Semua Promo
                </Link>
              </div>
            </div>
          </Reveal>
        </section>
      )}

      {/* LAYANAN */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionHeading eyebrow="Menu Perawatan" title="Pilih ritual cantikmu" desc="Harga transparan, durasi jelas, bisa langsung booking." />
          <Reveal delay={0.15}>
            <Link href="/layanan" className="group flex items-center gap-1 text-sm font-semibold text-sage-700">Semua layanan <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" /></Link>
          </Reveal>
        </div>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {layanan.map((l, k) => (
            <Reveal key={l.id} delay={k * 0.07}>
              <Link href={`/booking?layanan=${l.id}`} className="card-lift group block overflow-hidden rounded-3xl border border-stone-200/80 bg-white">
                <div className="relative h-44 overflow-hidden bg-sage-100">
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
                    <div className="flex h-full items-center justify-center bg-gradient-to-br from-sage-100 to-cream-200"><Scissors className="text-sage-600" size={30} /></div>
                  )}
                  <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-sage-700 backdrop-blur">{l.kategori.nama}</span>
                </div>
                <div className="p-5">
                  <p className="font-serif-display text-xl font-bold text-sage-900 transition group-hover:text-sage-700">{l.nama}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-stone-500">{l.deskripsi}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <p className="font-bold text-sage-700">{rupiah(l.harga)} <span className="text-xs font-normal text-stone-400">/ {l.durasiMenit} mnt</span></p>
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sage-700 text-white transition group-hover:bg-gold-500"><ArrowRight size={16} /></span>
                  </div>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* RITUAL */}
      <section className="border-y border-cream-200 bg-cream-100/60">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <SectionHeading align="center" eyebrow="Pengalaman" title="Ritual Edelweiss dalam 4 langkah" desc="Dari pintu masuk sampai pulang glowing — semuanya dirancang bikin rileks." />
          <div className="mt-10 grid gap-4 md:grid-cols-4">
            {[["01", "Sambutan hangat", "Welcome drink + konsultasi kebutuhan rambut/kulit."], ["02", "Treatment", "Dikerjakan terapis bersertifikat, produk aman."], ["03", "Relaksasi", "Teh hangat + pijat penutup di ruang tenang."], ["04", "Glowing pulang", "Tips perawatan + reminder jadwal berikutnya."]].map(([n, t, d], k) => (
              <Reveal key={n} delay={k * 0.08}>
                <div className="card-lift h-full rounded-3xl border border-white bg-white/80 p-6 backdrop-blur">
                  <p className="font-serif-display text-4xl font-bold text-gold-400">{n}</p>
                  <p className="mt-2 font-bold text-sage-900">{t}</p>
                  <p className="mt-1 text-sm text-stone-500">{d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONI */}
      <section className="relative overflow-hidden bg-sage-900 py-16">
        <div className="pointer-events-none absolute -left-20 top-0 h-72 w-72 rounded-full bg-gold-400/10 blur-3xl" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 md:grid-cols-[1fr_1.2fr]">
          <div>
            <SectionHeading dark eyebrow="Testimoni" title="Kata mereka yang sudah glowing" desc="Rating 4.9 dari 800+ ulasan Google & pelanggan langsung." />
            <Reveal delay={0.2}>
              <Link href="/testimoni" className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-gold-300">Lihat semua <ArrowRight size={15} /></Link>
            </Reveal>
          </div>
          <Reveal delay={0.1}><TestimonialCarousel data={testimoni} /></Reveal>
        </div>
      </section>

      {/* FAQ + CTA */}
      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-16 md:grid-cols-2">
        <div>
          <SectionHeading eyebrow="Sering ditanyakan" title="Masih ragu? Ini jawabannya" />
          <div className="mt-6"><Faq items={faqs} /></div>
        </div>
        <Reveal delay={0.1}>
          <div className="grain relative flex h-full flex-col justify-center overflow-hidden rounded-[2rem] bg-gradient-to-br from-sage-700 via-sage-800 to-sage-900 p-8 text-white shadow-2xl">
            <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-gold-400/25 blur-3xl" />
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-gold-300">Slot weekend cepat penuh</p>
            <p className="font-serif-display mt-2 text-3xl font-bold md:text-4xl">Siap glowing minggu ini?</p>
            <p className="mt-3 text-sm text-white/75">Amankan jadwalmu hari ini — konfirmasi otomatis via WhatsApp setelah booking.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/booking" className="rounded-full bg-gold-400 px-7 py-3 text-sm font-bold text-sage-900 transition hover:-translate-y-0.5 hover:bg-gold-300">Booking Online</Link>
              <Link href="/kontak" className="rounded-full border border-white/30 px-7 py-3 text-sm font-semibold transition hover:bg-white/10">Hubungi Kami</Link>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
