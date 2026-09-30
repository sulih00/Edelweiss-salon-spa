import { prisma } from "@/lib/prisma";
import { safeDb } from "@/lib/safe-db";
import { sessionRole } from "@/lib/roles";
import { redirect } from "next/navigation";
import BookingClient from "./BookingClient";

export default async function CmsBooking() {
  const s = await sessionRole();
  if (!s || !["OWNER", "ADMIN", "KASIR"].includes(s.role)) redirect("/cms");

  const data = await safeDb(
    () =>
      prisma.booking.findMany({
        include: { pelanggan: true, produk: true, karyawan: true, promo: true },
        orderBy: { jadwal: "desc" },
        take: 300,
      }),
    []
  );

  const formattedData = data.map((b) => ({
    id: b.id,
    jadwal: b.jadwal ? b.jadwal.toISOString() : new Date().toISOString(),
    status: b.status,
    diskon: b.diskon ?? 0,
    buktiTF: b.buktiTF,
    createdAt: b.createdAt ? b.createdAt.toISOString() : new Date().toISOString(),
    pelanggan: { nama: b.pelanggan?.nama || "Pelanggan", wa: b.pelanggan?.wa || "" },
    produk: { nama: b.produk?.nama || "Perawatan Salon", harga: b.produk?.harga ?? 0 },
    karyawan: b.karyawan ? { nama: b.karyawan.nama } : null,
    promo: b.promo ? { kode: b.promo.kode } : null,
  }));

  return <BookingClient data={formattedData} />;
}

