import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isDbDown } from "@/lib/api-safe";
import { cekPromo } from "@/lib/promo";
import { z } from "zod";

const schema = z.object({
  nama: z.string().min(2),
  wa: z.string().min(9),
  produkId: z.string(),
  karyawanId: z.string().optional(),
  jadwal: z.string(),
  catatan: z.string().optional(),
  kodePromo: z.string().optional(),
  buktiTF: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());
    const produk = await prisma.produk.findUnique({ where: { id: body.produkId } });
    if (!produk) return NextResponse.json({ error: "Layanan tidak ditemukan" }, { status: 400 });
    const jadwal = new Date(body.jadwal);
    if (isNaN(jadwal.getTime())) return NextResponse.json({ error: "Jadwal tidak valid" }, { status: 400 });
    if (jadwal.getTime() < Date.now() - 5 * 60 * 1000) {
      return NextResponse.json({ error: "Jadwal kedatangan tidak boleh waktu yang sudah lewat" }, { status: 400 });
    }

    let pelanggan = await prisma.pelanggan.findFirst({ where: { wa: body.wa } });
    if (!pelanggan) {
      pelanggan = await prisma.pelanggan.create({ data: { nama: body.nama, wa: body.wa } });
    }

    // Cegah duplikasi booking (Cek apakah ada booking identik dalam 2 menit terakhir)
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
    const duplicate = await prisma.booking.findFirst({
      where: {
        pelangganId: pelanggan.id,
        produkId: produk.id,
        jadwal,
        createdAt: { gte: twoMinutesAgo },
      },
    });

    if (duplicate) {
      return NextResponse.json(
        { error: "Booking serupa baru saja dikirimkan. Silakan cek konfirmasi atau hubungi admin." },
        { status: 409 }
      );
    }

    // Validasi promo (opsional)
    let promoId: string | null = null;
    let diskon = 0;
    let kodePromo: string | null = null;
    if (body.kodePromo?.trim()) {
      const promo = await prisma.promo.findUnique({ where: { kode: body.kodePromo.trim().toUpperCase() } });
      if (!promo) return NextResponse.json({ error: "Kode promo tidak ditemukan" }, { status: 400 });
      const cek = cekPromo(promo, produk.harga);
      if (!cek.ok) return NextResponse.json({ error: cek.error }, { status: 400 });
      promoId = promo.id;
      diskon = cek.diskon ?? 0;
      kodePromo = promo.kode;
      await prisma.promo.update({ where: { id: promo.id }, data: { terpakai: { increment: 1 } } });
    }

    const karyawanId = body.karyawanId && body.karyawanId !== "bebas" ? body.karyawanId : null;

    // Deteksi Bentrok Jadwal Terapis
    if (karyawanId) {
      const terapis = await prisma.karyawan.findUnique({ where: { id: karyawanId } });
      if (!terapis) {
        return NextResponse.json({ error: "Terapis yang dipilih tidak ditemukan" }, { status: 404 });
      }

      const durasiMenit = produk.durasiMenit || 60;
      const newStartMs = jadwal.getTime();
      const newEndMs = newStartMs + durasiMenit * 60 * 1000;

      // Cari booking terapis pada rentang hari yang sama
      const startOfDay = new Date(jadwal);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(jadwal);
      endOfDay.setHours(23, 59, 59, 999);

      const existingTherapistBookings = await prisma.booking.findMany({
        where: {
          karyawanId,
          status: { not: "BATAL" },
          jadwal: { gte: startOfDay, lte: endOfDay },
        },
        include: { produk: true },
      });

      // Cek apakah ada overlap (bentrok jam)
      const conflict = existingTherapistBookings.find((b) => {
        const bStartMs = new Date(b.jadwal).getTime();
        const bDuration = (b.produk?.durasiMenit || 60) * 60 * 1000;
        const bEndMs = bStartMs + bDuration;

        return bStartMs < newEndMs && bEndMs > newStartMs;
      });

      if (conflict) {
        const wibOpts = { timeZone: "Asia/Jakarta", hour: "2-digit", minute: "2-digit" } as const;
        const cStartStr = new Date(conflict.jadwal).toLocaleTimeString("id-ID", wibOpts);
        const cDur = conflict.produk?.durasiMenit || 60;
        const cEndMs = new Date(conflict.jadwal).getTime() + cDur * 60 * 1000;
        const cEndStr = new Date(cEndMs).toLocaleTimeString("id-ID", wibOpts);

        return NextResponse.json(
          {
            error: `Jadwal bentrok: Terapis ${terapis.nama} sudah memiliki jadwal perawatan pada jam ${cStartStr} - ${cEndStr}. Silakan pilih jam lain atau terapis lain.`,
          },
          { status: 409 }
        );
      }
    }


    const booking = await prisma.booking.create({
      data: {
        pelangganId: pelanggan.id,
        produkId: produk.id,
        karyawanId,
        jadwal,
        catatan: body.catatan,
        status: "BARU",
        promoId,
        diskon,
        buktiTF: body.buktiTF?.trim() || null,
      },
    });
    return NextResponse.json({
      ok: true,
      id: booking.id,
      nama: body.nama,
      wa: body.wa,
      layanan: produk.nama,
      jadwal: jadwal.toISOString(),
      kodePromo,
      diskon,
      total: produk.harga - diskon,
      buktiTF: body.buktiTF?.trim() || null,
    });
  } catch (e) {
    if (isDbDown(e))
      return NextResponse.json(
        { error: "Database Supabase tidak terjangkau. Coba lagi sebentar atau hubungi admin." },
        { status: 503 }
      );
    return NextResponse.json({ error: e instanceof Error ? e.message : "Gagal" }, { status: 400 });
  }
}
