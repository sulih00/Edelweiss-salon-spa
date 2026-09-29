import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRoles } from "@/lib/roles";

export async function GET(req: Request) {
  const { error } = await requireRoles(["OWNER", "ADMIN", "KASIR"]);
  if (error) return error;

  try {
    const { searchParams } = new URL(req.url);
    const bulan = searchParams.get("bulan"); // format: YYYY-MM
    let awal: Date;
    let akhir: Date;

    if (bulan && /^\d{4}-\d{2}$/.test(bulan)) {
      const [y, m] = bulan.split("-").map(Number);
      awal = new Date(y, m - 1, 1);
      akhir = new Date(y, m, 1);
    } else {
      const n = new Date();
      awal = new Date(n.getFullYear(), n.getMonth(), 1);
      akhir = new Date(n.getFullYear(), n.getMonth() + 1, 1);
    }

    const [karyawanList, bookings] = await Promise.all([
      prisma.karyawan.findMany({
        orderBy: { nama: "asc" },
      }),
      prisma.booking.findMany({
        where: {
          karyawanId: { not: null },
          status: "SELESAI",
          jadwal: { gte: awal, lt: akhir },
        },
        include: { produk: true, karyawan: true },
      }),
    ]);

    // Map stats per karyawan
    const mapKomisi = new Map<
      string,
      {
        id: string;
        nama: string;
        jabatan: string;
        komisiPersen: number;
        totalTreatment: number;
        totalOmzet: number;
        totalKomisi: number;
      }
    >();

    karyawanList.forEach((k) => {
      mapKomisi.set(k.id, {
        id: k.id,
        nama: k.nama,
        jabatan: k.jabatan,
        komisiPersen: k.komisiPersen,
        totalTreatment: 0,
        totalOmzet: 0,
        totalKomisi: 0,
      });
    });

    bookings.forEach((b) => {
      if (!b.karyawanId) return;
      let stat = mapKomisi.get(b.karyawanId);
      if (!stat && b.karyawan) {
        stat = {
          id: b.karyawan.id,
          nama: b.karyawan.nama,
          jabatan: b.karyawan.jabatan,
          komisiPersen: b.karyawan.komisiPersen,
          totalTreatment: 0,
          totalOmzet: 0,
          totalKomisi: 0,
        };
        mapKomisi.set(b.karyawanId, stat);
      }

      if (stat) {
        const hargaBersih = Math.max(0, (b.produk?.harga ?? 0) - (b.diskon ?? 0));
        const nominalKomisi = Math.round((hargaBersih * stat.komisiPersen) / 100);

        stat.totalTreatment += 1;
        stat.totalOmzet += hargaBersih;
        stat.totalKomisi += nominalKomisi;
      }
    });

    const result = Array.from(mapKomisi.values());
    const grandTotalOmzet = result.reduce((a, b) => a + b.totalOmzet, 0);
    const grandTotalKomisi = result.reduce((a, b) => a + b.totalKomisi, 0);

    return NextResponse.json({
      bulan,
      rekap: result,
      summary: {
        totalTreatment: bookings.length,
        grandTotalOmzet,
        grandTotalKomisi,
      },
    });
  } catch (err) {
    console.error("Gagal hitung komisi terapis:", err);
    return NextResponse.json({ error: "Gagal menghitung komisi karyawan" }, { status: 500 });
  }
}
