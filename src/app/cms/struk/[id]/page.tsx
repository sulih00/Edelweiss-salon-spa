import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatTanggal } from "@/lib/utils";
import StrukClientView from "./StrukClientView";

export default async function StrukPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const b = await prisma.booking.findUnique({
    where: { id },
    include: { pelanggan: true, produk: true, karyawan: true, promo: true, transaksi: true },
  });
  if (!b) notFound();

  // Cari booking lain yang dibuat bersamaan dalam transaksi POS multi-item (selisih <= 15 detik)
  const fifteenSecBefore = new Date(b.createdAt.getTime() - 15 * 1000);
  const fifteenSecAfter = new Date(b.createdAt.getTime() + 15 * 1000);

  const relatedBookings = await prisma.booking.findMany({
    where: {
      pelangganId: b.pelangganId,
      createdAt: { gte: fifteenSecBefore, lte: fifteenSecAfter },
    },
    include: { produk: true, karyawan: true, promo: true },
    orderBy: { createdAt: "asc" },
  });

  const allBookings = relatedBookings.length > 0 ? relatedBookings : [b];

  const items = allBookings.map((bk) => {
    const rawHarga = Number(bk.produk?.harga);
    const rawDiskon = Number(bk.diskon);
    return {
      id: bk.id,
      nama: bk.produk?.nama || "Perawatan Salon",
      harga: !isNaN(rawHarga) ? Math.max(0, rawHarga) : 0,
      diskon: !isNaN(rawDiskon) ? Math.max(0, rawDiskon) : 0,
      terapisNama: bk.karyawan?.nama || null,
    };
  });

  const subtotal = items.reduce((acc, it) => acc + (Number(it.harga) || 0), 0);
  const diskonTotal = items.reduce((acc, it) => acc + (Number(it.diskon) || 0), 0);
  const grandTotal = Math.max(0, subtotal - diskonTotal);

  // Ambil transaksi keuangan terkait untuk rincian metode bayar (termasuk split/DP)
  const bookingIds = allBookings.map((item) => item.id);
  const txList = await prisma.transaksiKeuangan.findMany({
    where: { bookingId: { in: bookingIds } },
  });

  const noNota = `EWS-${b.createdAt.getFullYear()}-${b.id.slice(-6).toUpperCase()}`;
  const promoKode = allBookings.find((bk) => bk.promo?.kode)?.promo?.kode || b.promo?.kode || null;

  const strukData = {
    id: b.id,
    noNota,
    tanggalStr: formatTanggal(b.jadwal),
    pelangganNama: b.pelanggan.nama,
    pelangganWa: b.pelanggan.wa,
    terapisNama: b.karyawan?.nama || null,
    items,
    subtotal,
    diskonTotal,
    promoKode,
    grandTotal,
    status: b.status,
    catatan: b.catatan,
    transaksiList: txList.map((t) => ({
      tipe: t.tipe,
      kategori: t.kategori,
      jumlah: t.jumlah,
      keterangan: t.keterangan,
    })),
  };

  return <StrukClientView data={strukData} />;
}

