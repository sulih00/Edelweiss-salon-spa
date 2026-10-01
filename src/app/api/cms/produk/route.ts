import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withDb } from "@/lib/api-safe";
import { requireRoles, requireAuth } from "@/lib/roles";

// PRODUK
export async function GET() {
  const a = await requireAuth(); if (a) return a;
  try {
    const [produk, kategori] = await Promise.all([
      prisma.produk.findMany({ include: { kategori: true }, orderBy: { createdAt: "desc" } }),
      prisma.kategoriProduk.findMany({ orderBy: { nama: "asc" } }),
    ]);
    return NextResponse.json({ produk, kategori });
  } catch (e) {
    console.error("[api/cms/produk] DB gagal:", (e as Error)?.message ?? e);
    return NextResponse.json({ produk: [], kategori: [] });
  }
}

export async function POST(req: Request) {
  const { error } = await requireRoles(["OWNER", "ADMIN", "KASIR"]);
  if (error) return error;
  return withDb(async () => {
    const b = await req.json();

  const existing = await prisma.produk.findFirst({
    where: { nama: { equals: b.nama.trim() } },
  });
  if (existing) {
    return NextResponse.json({ error: `Produk/Layanan "${b.nama}" sudah ada di katalog.` }, { status: 409 });
  }

  const data = await prisma.produk.create({
    data: {
      nama: b.nama.trim(), kategoriId: b.kategoriId, harga: Number(b.harga ?? 0),
      durasiMenit: Number(b.durasiMenit ?? 60), stok: Number(b.stok ?? 0),
      deskripsi: b.deskripsi ?? "", foto: b.foto ?? null,
      isLayanan: b.isLayanan !== false, aktif: true,
    },
  });
    return NextResponse.json(data);
  }, { logTag: "cms/produk" });
}

export async function PUT(req: Request) {
  const { error } = await requireRoles(["OWNER", "ADMIN", "KASIR"]);
  if (error) return error;
  return withDb(async () => {
    const b = await req.json();
    const { id, ...rest } = b;
    const updateData: Record<string, unknown> = {};
    if (rest.nama !== undefined) updateData.nama = String(rest.nama).trim();
    if (rest.kategoriId !== undefined) updateData.kategoriId = rest.kategoriId;
    if (rest.harga !== undefined) updateData.harga = Number(rest.harga);
    if (rest.durasiMenit !== undefined) updateData.durasiMenit = Number(rest.durasiMenit);
    if (rest.stok !== undefined) updateData.stok = Number(rest.stok);
    if (rest.deskripsi !== undefined) updateData.deskripsi = rest.deskripsi;
    if (rest.foto !== undefined) updateData.foto = rest.foto;
    if (rest.isLayanan !== undefined) updateData.isLayanan = Boolean(rest.isLayanan);
    if (rest.aktif !== undefined) updateData.aktif = Boolean(rest.aktif);

    const data = await prisma.produk.update({ where: { id }, data: updateData });
    return NextResponse.json(data);
  }, { logTag: "cms/produk" });
}

export async function DELETE(req: Request) {
  const { error } = await requireRoles(["OWNER", "ADMIN"]);
  if (error) return error;
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "no id" }, { status: 400 });
  return withDb(async () => {
    const dipakai = await prisma.booking.count({ where: { produkId: id } });
    if (dipakai > 0)
      return NextResponse.json(
        { error: `Tidak bisa dihapus: produk sudah dipakai ${dipakai}x booking. Nonaktifkan saja agar histori aman.` },
        { status: 409 }
      );
    try {
      await prisma.produk.delete({ where: { id } });
    } catch (e: unknown) {
      if ((e as { code?: string }).code === "P2003")
        return NextResponse.json({ error: "Tidak bisa dihapus: data masih dipakai di bagian lain." }, { status: 409 });
      throw e;
    }
    return NextResponse.json({ ok: true });
  }, { logTag: "cms/produk" });
}
