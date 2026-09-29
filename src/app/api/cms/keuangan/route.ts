import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRoles } from "@/lib/roles";

export async function GET() {
  const { error } = await requireRoles(["OWNER", "ADMIN"]);
  if (error) return error;

  try {
    const data = await prisma.transaksiKeuangan.findMany({ orderBy: { tanggal: "desc" }, take: 300 });
    return NextResponse.json(data);
  } catch (err) {
    console.error("Keuangan GET error:", err);
    return NextResponse.json({ error: "Gagal memuat data keuangan" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const { error } = await requireRoles(["OWNER", "ADMIN"]);
  if (error) return error;

  try {
    const b = await req.json();
    if (!b.tipe || !b.kategori || !b.jumlah || isNaN(Number(b.jumlah))) {
      return NextResponse.json({ error: "Lengkapi tipe, kategori, dan jumlah transaksi" }, { status: 400 });
    }

    const data = await prisma.transaksiKeuangan.create({
      data: {
        tipe: b.tipe === "KELUAR" ? "KELUAR" : "MASUK",
        kategori: String(b.kategori).trim(),
        jumlah: Math.abs(Number(b.jumlah)),
        keterangan: b.keterangan ? String(b.keterangan).trim() : "",
        tanggal: b.tanggal ? new Date(b.tanggal) : new Date(),
      },
    });
    return NextResponse.json(data);
  } catch (err) {
    console.error("Keuangan POST error:", err);
    return NextResponse.json({ error: "Gagal menyimpan transaksi keuangan" }, { status: 500 });
  }
}

