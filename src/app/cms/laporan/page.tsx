import { prisma } from "@/lib/prisma";
import { safeDb } from "@/lib/safe-db";
import { rupiah } from "@/lib/utils";
import { sessionRole } from "@/lib/roles";
import { redirect } from "next/navigation";
import { PageHeader, Stat } from "@/components/admin";
import PrintButton from "@/components/PrintButton";
import LaporanExport, { type LaporanRow } from "./LaporanExport";
import { Wallet, TrendingDown, Scale, TicketPercent, CalendarCheck } from "lucide-react";

function bulanIni() {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}`;
}

import LaporanClient from "./LaporanClient";

export default async function LaporanPage({ searchParams }: { searchParams: Promise<{ bulan?: string }> }) {
  const s = await sessionRole();
  if (!s || !["OWNER", "ADMIN"].includes(s.role)) redirect("/cms");
  const sp = await searchParams;
  const bulan = sp.bulan ?? bulanIni();
  const [y, m] = bulan.split("-").map(Number);
  const awal = new Date(y, m - 1, 1);
  const akhir = new Date(y, m, 1);
  const labelBulan = awal.toLocaleDateString("id-ID", { timeZone: "Asia/Jakarta", month: "long", year: "numeric" });

  const [trx, bookings, katGroup] = await safeDb(
    () =>
      Promise.all([
        prisma.transaksiKeuangan.findMany({ where: { tanggal: { gte: awal, lt: akhir } }, orderBy: { tanggal: "asc" } }),
        prisma.booking.findMany({
          where: { jadwal: { gte: awal, lt: akhir }, status: { not: "BATAL" } },
          include: { pelanggan: true, produk: true, promo: true },
          orderBy: { jadwal: "asc" },
        }),
        prisma.transaksiKeuangan.groupBy({
          by: ["tipe", "kategori"],
          where: { tanggal: { gte: awal, lt: akhir } },
          _sum: { jumlah: true },
          _count: true,
        }),
      ]),
    [[], [], []] as unknown as [
      { id: string; tanggal: Date; tipe: string; kategori: string; jumlah: number; keterangan: string | null }[],
      {
        id: string;
        status: string;
        diskon: number | null;
        pelanggan: { nama: string };
        produk: { nama: string; harga: number };
      }[],
      { tipe: string; kategori: string; _sum: { jumlah: number | null }; _count: number }[]
    ]
  );

  const masuk = trx.filter((t) => t.tipe === "MASUK").reduce((a, b) => a + b.jumlah, 0);
  const keluar = trx.filter((t) => t.tipe === "KELUAR").reduce((a, b) => a + b.jumlah, 0);
  const selesai = bookings.filter((b) => b.status === "SELESAI").length;
  const diskon = bookings.reduce((a, b) => a + (b.diskon ?? 0), 0);

  const rows: LaporanRow[] = trx.map((t) => ({
    tanggal: new Date(t.tanggal).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" }),
    keterangan: t.keterangan ?? "-",
    kategori: t.kategori,
    tipe: t.tipe,
    jumlah: t.jumlah,
  }));

  return (
    <div>
      <PageHeader
        title={`Laporan ${labelBulan}`}
        desc="Rekap bulanan siap cetak / export."
        action={
          <div className="flex flex-wrap gap-2">
            <LaporanExport bulan={bulan} rows={rows} />
            <PrintButton label="Cetak / PDF" />
          </div>
        }
      />

      <form method="GET" className="mb-4 flex items-end gap-2 rounded-2xl border border-stone-200/70 bg-white p-4 shadow-sm print:hidden">
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500">Periode bulan</label>
          <input
            type="month"
            name="bulan"
            defaultValue={bulan}
            className="rounded-xl border border-stone-300 px-3 py-2 text-sm outline-none focus:border-sage-600"
          />
        </div>
        <button className="rounded-xl bg-sage-700 px-4 py-2 text-sm font-semibold text-white">Tampilkan</button>
      </form>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Stat icon={<Wallet size={20} />} label="Kas masuk" value={rupiah(masuk)} tone="green" />
        <Stat icon={<TrendingDown size={20} />} label="Kas keluar" value={rupiah(keluar)} tone="red" />
        <Stat icon={<Scale size={20} />} label="Saldo" value={rupiah(masuk - keluar)} tone="sage" />
        <Stat icon={<CalendarCheck size={20} />} label="Treatment selesai" value={`${selesai}/${bookings.length}`} tone="gold" />
        <Stat icon={<TicketPercent size={20} />} label="Total diskon" value={rupiah(diskon)} tone="sage" />
      </div>

      <LaporanClient katGroup={katGroup} bookings={bookings} />
    </div>
  );
}
