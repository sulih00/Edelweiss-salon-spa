import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { safeDb } from "@/lib/safe-db";
import { rupiah } from "@/lib/utils";
import { PageHeader, Stat, TableShell, Th, Td, Badge } from "@/components/admin";
import DashboardCharts, { type PaymentRow } from "./DashboardCharts";
import { Wallet, TrendingDown, CalendarCheck, BellRing, Award, Receipt } from "lucide-react";

function dayKey(d: Date) {
  // Kunci harian menurut WIB (en-CA menghasilkan YYYY-MM-DD).
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

// Awal hari WIB ke-n (0 = hari ini) sebagai instant UTC.
function wibDayStart(offsetDays = 0): Date {
  const wib = new Date(Date.now() + 7 * 3600 * 1000);
  const t = Date.UTC(wib.getUTCFullYear(), wib.getUTCMonth(), wib.getUTCDate() + offsetDays);
  return new Date(t - 7 * 3600 * 1000);
}

export default async function CmsDashboard() {
  const today = wibDayStart(0);
  const ago30 = wibDayStart(-29);

  const wibNowParts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date());
  const wibYear = Number(wibNowParts.find((p) => p.type === "year")?.value);
  const wibMonth = Number(wibNowParts.find((p) => p.type === "month")?.value);
  const startOfMonth = new Date(Date.UTC(wibYear, wibMonth - 1, 1) - 7 * 3600 * 1000);

  type DashTuple = [
    number,
    number,
    number,
    { tipe: string; jumlah: number }[],
    { tanggal: Date; tipe: string; jumlah: number; keterangan: string | null }[],
    { status: string; _count: number }[],
    { produkId: string; _count: number }[],
    {
      id: string;
      status: string;
      pelanggan: { nama: string; wa: string };
      produk: { nama: string };
      karyawan: { nama: string } | null;
    }[],
    { karyawanId: string | null; _count: number }[]
  ];
  const [bookingHari, bookingBaru, produkAktif, transaksiHari, trx30, bookings30, topGroup, recent, topTherapistGroup] =
    await safeDb<DashTuple>(
      () =>
        Promise.all([
          prisma.booking.count({ where: { jadwal: { gte: today } } }),
          prisma.booking.count({ where: { status: "BARU" } }),
          prisma.produk.count({ where: { aktif: true } }),
          prisma.transaksiKeuangan.findMany({ where: { tanggal: { gte: today } } }),
          prisma.transaksiKeuangan.findMany({
            where: { tanggal: { gte: ago30 } },
            select: { tanggal: true, tipe: true, jumlah: true, keterangan: true },
          }),
          prisma.booking.groupBy({ by: ["status"], where: { createdAt: { gte: ago30 } }, _count: true }),
          prisma.booking.groupBy({
            by: ["produkId"],
            where: { status: { not: "BATAL" } },
            _count: true,
            orderBy: { _count: { produkId: "desc" } },
            take: 5,
          }),
          prisma.booking.findMany({
            include: { pelanggan: true, produk: true, karyawan: true },
            orderBy: { createdAt: "desc" },
            take: 8,
          }),
          prisma.booking.groupBy({
            by: ["karyawanId"],
            where: {
              status: "SELESAI",
              karyawanId: { not: null },
              jadwal: { gte: startOfMonth },
            },
            _count: true,
            orderBy: { _count: { karyawanId: "desc" } },
            take: 1,
          }),
        ]) as unknown as Promise<DashTuple>,
      [0, 0, 0, [], [], [], [], [], []]
    );

  const omzetHari = transaksiHari.filter((t) => t.tipe === "MASUK").reduce((a, b) => a + b.jumlah, 0);
  const keluarHari = transaksiHari.filter((t) => t.tipe === "KELUAR").reduce((a, b) => a + b.jumlah, 0);

  // Daily series (14 days, tanggal WIB)
  const days: { key: string; label: string }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = wibDayStart(-i);
    days.push({ key: dayKey(d), label: d.toLocaleDateString("id-ID", { timeZone: "Asia/Jakarta", day: "numeric", month: "short" }) });
  }

  const daily = days.map((d) => ({
    tgl: d.label,
    masuk: trx30
      .filter((t) => dayKey(new Date(t.tanggal)) === d.key && t.tipe === "MASUK")
      .reduce((a, b) => a + b.jumlah, 0),
    keluar: trx30
      .filter((t) => dayKey(new Date(t.tanggal)) === d.key && t.tipe === "KELUAR")
      .reduce((a, b) => a + b.jumlah, 0),
  }));

  const byStatus = bookings30.map((g) => ({ status: g.status, jumlah: g._count }));

  // Payment Method Breakdown from transaksiKeuangan in the last 30 days
  const paymentMap = new Map<string, { total: number; count: number }>();
  ["TUNAI", "QRIS", "TRANSFER", "DEBIT"].forEach((m) => paymentMap.set(m, { total: 0, count: 0 }));

  trx30.forEach((t) => {
    if (t.tipe !== "MASUK") return;
    const ket = (t.keterangan || "").toUpperCase();
    let matched = "TUNAI";
    if (ket.includes("QRIS")) matched = "QRIS";
    else if (ket.includes("TRANSFER")) matched = "TRANSFER";
    else if (ket.includes("DEBIT")) matched = "DEBIT";

    const curr = paymentMap.get(matched) || { total: 0, count: 0 };
    paymentMap.set(matched, { total: curr.total + t.jumlah, count: curr.count + 1 });
  });

  const paymentData: PaymentRow[] = Array.from(paymentMap.entries())
    .map(([metode, val]) => ({ metode, total: val.total, count: val.count }))
    .filter((p) => p.total > 0);

  // Top Products & Treatments
  const prodNames = await safeDb(
    () =>
      prisma.produk.findMany({
        where: { id: { in: topGroup.map((g) => g.produkId) } },
        select: { id: true, nama: true },
      }),
    [] as { id: string; nama: string }[]
  );

  const top = topGroup.map((g) => ({
    layanan: (prodNames.find((p) => p.id === g.produkId)?.nama ?? "?").slice(0, 24),
    jumlah: g._count,
  }));

  // Top Therapist of the Month
  let topTherapistName = "—";
  let topTherapistCount = 0;
  if (topTherapistGroup.length > 0 && topTherapistGroup[0].karyawanId) {
    const k = await safeDb(
      () => prisma.karyawan.findUnique({ where: { id: topTherapistGroup[0].karyawanId! } }),
      null
    );
    if (k) {
      topTherapistName = k.nama;
      topTherapistCount = topTherapistGroup[0]._count;
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Dashboard Analitik Operasional"
        desc="Visualisasi arus kas, kinerja perawatan, dan performa transaksi Edelweiss Salon & Makeup Art."
      />

      {/* Primary Metric Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={<Wallet size={20} />} label="Omzet Hari Ini" value={rupiah(omzetHari)} tone="green" />
        <Stat icon={<TrendingDown size={20} />} label="Pengeluaran Hari Ini" value={rupiah(keluarHari)} tone="red" />
        <Stat
          icon={<CalendarCheck size={20} />}
          label="Booking Hari Ini+"
          value={`${bookingHari} Booking`}
          sub={`${produkAktif} layanan aktif`}
          tone="sage"
        />
        <Stat
          icon={<BellRing size={20} />}
          label="Perlu Konfirmasi"
          value={`${bookingBaru} BARU`}
          sub="Booking menunggu tanggapan"
          tone="gold"
        />
      </div>

      {/* Top Therapist Badge Highlight */}
      <div className="rounded-3xl border border-gold-200/90 bg-gradient-to-r from-gold-50/80 via-white to-gold-50/50 p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-gold-500 p-2.5 text-white shadow-md">
            <Award size={22} />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-gold-700 tracking-wider">
              Terapis Terfavorit Bulan Ini
            </span>
            <p className="font-serif-display text-base font-bold text-stone-900">
              👑 {topTherapistName} {topTherapistCount > 0 ? `(${topTherapistCount} Perawatan Selesai)` : ""}
            </p>
          </div>
        </div>

        <Link
          href="/cms/karyawan"
          className="rounded-xl bg-gold-500 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-gold-600"
        >
          Lihat Komisi Terapis →
        </Link>
      </div>

      {/* Interactive Charts Section */}
      <DashboardCharts daily={daily} byStatus={byStatus} top={top} paymentData={paymentData} />

      {/* Recent Bookings & POS Transactions */}
      <div className="rounded-3xl border border-stone-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b border-stone-100 px-6 py-4">
          <div>
            <h2 className="font-serif-display text-lg font-bold text-stone-900">Transaksi &amp; Booking Terbaru</h2>
            <p className="text-xs text-stone-400">8 aktivitas booking &amp; POS kasir paling akhir</p>
          </div>
          <Link
            href="/cms/booking"
            className="text-xs font-bold text-sage-800 hover:text-sage-950 transition"
          >
            Lihat Semua Booking →
          </Link>
        </div>

        <TableShell>
          <thead>
            <tr>
              <Th>Pelanggan</Th>
              <Th>Perawatan / Produk</Th>
              <Th>Terapis</Th>
              <Th>Status</Th>
              <Th className="text-right">Struk / Nota</Th>
            </tr>
          </thead>
          <tbody>
            {recent.map((b) => (
              <tr key={b.id} className="transition hover:bg-stone-50">
                <Td>
                  <p className="font-bold text-stone-900">{b.pelanggan.nama}</p>
                  <p className="text-xs text-stone-400">{b.pelanggan.wa}</p>
                </Td>
                <Td className="font-medium text-stone-800">{b.produk.nama}</Td>
                <Td className="text-xs text-stone-500">
                  {b.karyawan ? `👤 ${b.karyawan.nama}` : "✨ Terapis Bebas"}
                </Td>
                <Td>
                  <Badge
                    tone={
                      b.status === "BARU"
                        ? "gold"
                        : b.status === "SELESAI"
                        ? "green"
                        : b.status === "BATAL"
                        ? "red"
                        : "sage"
                    }
                  >
                    {b.status}
                  </Badge>
                </Td>
                <Td className="text-right">
                  {b.status === "SELESAI" ? (
                    <Link
                      href={`/cms/struk/${b.id}`}
                      className="inline-flex items-center gap-1 rounded-xl border border-stone-200 bg-stone-50 px-2.5 py-1 text-xs font-bold text-stone-700 transition hover:bg-stone-100 hover:text-stone-900"
                    >
                      <Receipt size={13} /> Struk
                    </Link>
                  ) : (
                    <span className="text-xs text-stone-300">—</span>
                  )}
                </Td>
              </tr>
            ))}
          </tbody>
        </TableShell>
        {recent.length === 0 && <p className="px-6 py-8 text-center text-xs text-stone-400">Belum ada aktivitas booking.</p>}
      </div>
    </div>
  );
}
