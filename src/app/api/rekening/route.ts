import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Publik: daftar rekening aktif untuk halaman booking
export async function GET() {
  try {
    const data = await prisma.rekening.findMany({
      where: { aktif: true },
      orderBy: [{ urutan: "asc" }, { createdAt: "asc" }],
      select: { id: true, bank: true, nomor: true, atasNama: true },
    });
    return NextResponse.json(data);
  } catch (e) {
    console.error("[api/rekening] DB gagal, fallback kosong:", (e as Error)?.message ?? e);
    return NextResponse.json([]);
  }
}
