import { prisma } from "@/lib/prisma";
import { safeDb } from "@/lib/safe-db";
import { sessionRole } from "@/lib/roles";
import { redirect } from "next/navigation";
import PelangganClient from "./PelangganClient";

export default async function PelangganPage() {
  const s = await sessionRole();
  if (!s || !["OWNER", "ADMIN", "KASIR"].includes(s.role)) redirect("/cms");

  const data = await safeDb(
    () =>
      prisma.pelanggan.findMany({
        include: {
          bookings: {
            include: { produk: true, karyawan: true },
            orderBy: { jadwal: "desc" },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 200,
      }),
    []
  );

  const formattedData = data.map((p) => ({
    id: p.id,
    nama: p.nama,
    wa: p.wa,
    alamat: p.alamat,
    poin: p.poin ?? 0,
    createdAt: p.createdAt.toISOString(),
    bookings: p.bookings.map((b) => ({
      id: b.id,
      jadwal: b.jadwal.toISOString(),
      status: b.status,
      diskon: b.diskon ?? 0,
      catatan: b.catatan,
      produk: { nama: b.produk.nama, harga: b.produk.harga },
      karyawan: b.karyawan ? { nama: b.karyawan.nama } : null,
    })),
  }));

  return <PelangganClient data={formattedData} />;
}


