import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/roles";
import { requireRoles } from "@/lib/roles";

export async function GET() {
  const a = await requireAuth(); if (a) return a;
  const data = await prisma.promo.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const { error } = await requireRoles(["OWNER", "ADMIN"]);
  if (error) return error;
  const b = await req.json();
  if (!b.kode || !b.nama) return NextResponse.json({ error: "Kode & nama wajib" }, { status: 400 });
  const data = await prisma.promo.create({
    data: {
      kode: String(b.kode).trim().toUpperCase(),
      nama: b.nama,
      deskripsi: b.deskripsi ?? "",
      tipe: b.tipe === "NOMINAL" ? "NOMINAL" : "PERSEN",
      nilai: Number(b.nilai ?? 10),
      minBelanja: Number(b.minBelanja ?? 0),
      maxDiskon: b.maxDiskon ? Number(b.maxDiskon) : null,
      kuota: b.kuota ? Number(b.kuota) : null,
      mulai: b.mulai ? new Date(b.mulai) : new Date(),
      berakhir: b.berakhir ? new Date(b.berakhir) : null,
      aktif: b.aktif !== false,
    },
  });
  return NextResponse.json(data);
}

export async function PUT(req: Request) {
  const { error } = await requireRoles(["OWNER", "ADMIN"]);
  if (error) return error;
  const b = await req.json();
  const { id, ...rest } = b;
  const data = await prisma.promo.update({
    where: { id },
    data: {
      ...("kode" in rest ? { kode: String(rest.kode).trim().toUpperCase() } : {}),
      ...("nama" in rest ? { nama: rest.nama } : {}),
      ...("deskripsi" in rest ? { deskripsi: rest.deskripsi } : {}),
      ...("tipe" in rest ? { tipe: rest.tipe === "NOMINAL" ? "NOMINAL" : "PERSEN" } : {}),
      ...("nilai" in rest ? { nilai: Number(rest.nilai) } : {}),
      ...("minBelanja" in rest ? { minBelanja: Number(rest.minBelanja) } : {}),
      maxDiskon: rest.maxDiskon ? Number(rest.maxDiskon) : null,
      kuota: rest.kuota ? Number(rest.kuota) : null,
      ...("mulai" in rest && rest.mulai ? { mulai: new Date(rest.mulai) } : {}),
      berakhir: rest.berakhir ? new Date(rest.berakhir) : null,
      ...("aktif" in rest ? { aktif: !!rest.aktif } : {}),
    },
  });
  return NextResponse.json(data);
}

export async function DELETE(req: Request) {
  const { error } = await requireRoles(["OWNER", "ADMIN"]);
  if (error) return error;
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "no id" }, { status: 400 });
  const dipakai = await prisma.booking.count({ where: { promoId: id } });
  if (dipakai > 0)
    return NextResponse.json(
      { error: `Tidak bisa dihapus: promo sudah dipakai ${dipakai}x booking. Nonaktifkan saja agar histori aman.` },
      { status: 409 }
    );
  await prisma.promo.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
