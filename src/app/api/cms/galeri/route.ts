import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRoles } from "@/lib/roles";

export async function GET() {
  const a = await requireAuth(); if (a) return a;
  const data = await prisma.galeri.findMany({ orderBy: { id: "desc" } });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const { error } = await requireRoles(["OWNER", "ADMIN"]);
  if (error) return error;
  const b = await req.json();
  if (!b.foto) return NextResponse.json({ error: "Foto wajib" }, { status: 400 });
  const data = await prisma.galeri.create({ data: { foto: b.foto, judul: b.judul ?? "" } });
  return NextResponse.json(data);
}

export async function PUT(req: Request) {
  const { error } = await requireRoles(["OWNER", "ADMIN"]);
  if (error) return error;
  const b = await req.json();
  const data = await prisma.galeri.update({ where: { id: b.id }, data: { tampil: b.tampil, judul: b.judul, foto: b.foto } });
  return NextResponse.json(data);
}

export async function DELETE(req: Request) {
  const { error } = await requireRoles(["OWNER", "ADMIN"]);
  if (error) return error;
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "no id" }, { status: 400 });
  await prisma.galeri.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

