import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const SLOTS = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"];

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const tgl = searchParams.get("tanggal"); // YYYY-MM-DD
    const karyawanId = searchParams.get("karyawanId");
    const produkId = searchParams.get("produkId");

    if (!tgl || !/^\d{4}-\d{2}-\d{2}$/.exec(tgl)) {
      return NextResponse.json({ error: "Format tanggal wajib YYYY-MM-DD" }, { status: 400 });
    }

    const start = new Date(`${tgl}T00:00:00`);
    const end = new Date(`${tgl}T23:59:59`);

    // 1 round-trip DB: 3 query jalan paralel.
    const [produk, existingBookings, activeTherapistsCount] = await Promise.all([
      produkId ? prisma.produk.findUnique({ where: { id: produkId } }) : Promise.resolve(null),
      prisma.booking.findMany({
        where: {
          status: { not: "BATAL" },
          jadwal: { gte: start, lte: end },
          ...(karyawanId && karyawanId !== "bebas" ? { karyawanId } : {}),
        },
        select: { id: true, jadwal: true, karyawanId: true, produk: { select: { durasiMenit: true } } },
      }),
      prisma.karyawan.count({ where: { aktif: true } }),
    ]);

    let serviceDurationMin = 60;
    if (produk?.durasiMenit) serviceDurationMin = produk.durasiMenit;

    const maxCapacityPerSlot = karyawanId && karyawanId !== "bebas" ? 1 : Math.max(1, activeTherapistsCount);

    const now = new Date();
    // "Hari ini" menurut WIB, bukan jam server (UTC).
    const wibNow = new Date(now.getTime() + 7 * 3600 * 1000);
    const todayLocalStr = `${wibNow.getUTCFullYear()}-${String(wibNow.getUTCMonth() + 1).padStart(2, "0")}-${String(wibNow.getUTCDate()).padStart(2, "0")}`;
    const isToday = tgl === todayLocalStr;

    const slotsResult = SLOTS.map((jam) => {
      // Slot adalah jam dinding WIB.
      const slotTime = new Date(`${tgl}T${jam}:00+07:00`);
      const slotStartMs = slotTime.getTime();
      const slotEndMs = slotStartMs + serviceDurationMin * 60 * 1000;
      const isPast = isToday && slotTime.getTime() <= now.getTime();

      // Hitung booking yang mengalami overlap (bentrok jam & durasi)
      const overlappingBookings = existingBookings.filter((b) => {
        const bStartMs = new Date(b.jadwal).getTime();
        const bDur = (b.produk?.durasiMenit || 60) * 60 * 1000;
        const bEndMs = bStartMs + bDur;

        return bStartMs < slotEndMs && bEndMs > slotStartMs;
      });

      const bookedCount = overlappingBookings.length;
      const terisi = isPast || bookedCount >= maxCapacityPerSlot;

      return {
        jam,
        isPast,
        bookedCount,
        capacity: maxCapacityPerSlot,
        terisi,
      };
    });

    return NextResponse.json({ tanggal: tgl, slots: slotsResult });
  } catch (e) {
    console.error("[api/booking/slots] DB gagal, fallback slot kosong:", (e as Error)?.message ?? e);
    // Jangan 500: kembalikan slot default agar halaman booking tetap bisa dibuka.
    // Frontend bisa pakai flag `stale` untuk tampilkan peringatan.
    const now = new Date();
    const wibNow = new Date(now.getTime() + 7 * 3600 * 1000);
    const todayLocalStr = `${wibNow.getUTCFullYear()}-${String(wibNow.getUTCMonth() + 1).padStart(2, "0")}-${String(wibNow.getUTCDate()).padStart(2, "0")}`;
    let tglFallback = todayLocalStr;
    try {
      const { searchParams } = new URL(req.url);
      const t = searchParams.get("tanggal");
      if (t && /^\d{4}-\d{2}-\d{2}$/.exec(t)) tglFallback = t;
    } catch {
      /* abaikan */
    }
    const isToday = tglFallback === todayLocalStr;
    return NextResponse.json({
      tanggal: tglFallback,
      stale: true,
      slots: SLOTS.map((jam) => {
        const slotTime = new Date(`${tglFallback}T${jam}:00+07:00`);
        const isPast = isToday && slotTime.getTime() <= now.getTime();
        return { jam, isPast, bookedCount: 0, capacity: 1, terisi: isPast };
      }),
    });
  }
}

