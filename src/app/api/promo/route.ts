import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cekPromo } from "@/lib/promo";
import { z } from "zod";

const schema = z.object({ kode: z.string().min(1), produkId: z.string() });

export async function POST(req: Request) {
  try {
    const { kode, produkId } = schema.parse(await req.json());
    const promo = await prisma.promo.findUnique({ where: { kode: kode.trim().toUpperCase() } });
    if (!promo) return NextResponse.json({ ok: false, error: "Kode tidak ditemukan" }, { status: 404 });
    const produk = await prisma.produk.findUnique({ where: { id: produkId } });
    if (!produk) return NextResponse.json({ ok: false, error: "Layanan tidak valid" }, { status: 400 });
    const cek = cekPromo(promo, produk.harga);
    if (!cek.ok) return NextResponse.json({ ok: false, error: cek.error }, { status: 400 });
    return NextResponse.json({
      ok: true,
      promo: { kode: promo.kode, nama: promo.nama, tipe: promo.tipe, nilai: promo.nilai },
      diskon: cek.diskon,
      total: produk.harga - (cek.diskon ?? 0),
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "Gagal" }, { status: 400 });
  }
}

// Daftar promo aktif untuk halaman publik
export async function GET() {
  const now = new Date();
  const data = await prisma.promo.findMany({
    where: { aktif: true, mulai: { lte: now }, OR: [{ berakhir: null }, { berakhir: { gte: now } }] },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(
    data.filter((p) => p.kuota == null || p.terpakai < p.kuota)
  );
}
