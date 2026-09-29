import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Publik: daftar rekening aktif untuk halaman booking
export async function GET() {
  const data = await prisma.rekening.findMany({
    where: { aktif: true },
    orderBy: [{ urutan: "asc" }, { createdAt: "asc" }],
    select: { id: true, bank: true, nomor: true, atasNama: true },
  });
  return NextResponse.json(data);
}
