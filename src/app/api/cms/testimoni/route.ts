import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/roles";
import { requireRoles } from "@/lib/roles";

export async function GET() {
  const a = await requireAuth(); if (a) return a;
  const data = await prisma.testimoni.findMany({ orderBy: { id: "desc" } });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const { error } = await requireRoles(["OWNER", "ADMIN"]);
  if (error) return error;
  const b = await req.json();
  if (!b.nama || !b.isi) return NextResponse.json({ error: "Nama & isi wajib diisi" }, { status: 400 });
  const data = await prisma.testimoni.create({
    data: {
      nama: b.nama,
      isi: b.isi,
      rating: Math.min(5, Math.max(1, Number(b.rating ?? 5))),
      tampil: b.tampil !== false,
    },
  });
  return NextResponse.json(data);
}

export async function PUT(req: Request) {
  const { error } = await requireRoles(["OWNER", "ADMIN"]);
  if (error) return error;
  const b = await req.json();
  const data = await prisma.testimoni.update({
    where: { id: b.id },
    data: {
      ...("nama" in b ? { nama: b.nama } : {}),
      ...("isi" in b ? { isi: b.isi } : {}),
      ...("rating" in b ? { rating: Math.min(5, Math.max(1, Number(b.rating))) } : {}),
      ...("tampil" in b ? { tampil: !!b.tampil } : {}),
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
  await prisma.testimoni.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
