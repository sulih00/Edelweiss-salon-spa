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

    let serviceDurationMin = 60;
    if (produkId) {
      const p = await prisma.produk.findUnique({ where: { id: produkId } });
      if (p && p.durasiMenit) serviceDurationMin = p.durasiMenit;
    }

    const start = new Date(`${tgl}T00:00:00`);
    const end = new Date(`${tgl}T23:59:59`);

    const existingBookings = await prisma.booking.findMany({
      where: {
        status: { not: "BATAL" },
        jadwal: { gte: start, lte: end },
        ...(karyawanId && karyawanId !== "bebas" ? { karyawanId } : {}),
      },
      select: { id: true, jadwal: true, karyawanId: true, produk: { select: { durasiMenit: true } } },
    });

    const activeTherapistsCount = await prisma.karyawan.count({ where: { aktif: true } });
    const maxCapacityPerSlot = karyawanId && karyawanId !== "bebas" ? 1 : Math.max(1, activeTherapistsCount);

    const now = new Date();
    const todayLocalStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const isToday = tgl === todayLocalStr;

    const slotsResult = SLOTS.map((jam) => {
      const slotTime = new Date(`${tgl}T${jam}:00`);
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
    return NextResponse.json({ error: e instanceof Error ? e.message : "Gagal mengambil slot" }, { status: 500 });
  }
}

