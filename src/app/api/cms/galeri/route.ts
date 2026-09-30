import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withDb } from "@/lib/api-safe";
import { requireAuth, requireRoles } from "@/lib/roles";

export async function GET() {
  const a = await requireAuth(); if (a) return a;
  try {
    const data = await prisma.galeri.findMany({ orderBy: { id: "desc" } });
    return NextResponse.json(data);
  } catch (e) {
    console.error("[api/cms/galeri] DB gagal:", (e as Error)?.message ?? e);
    return NextResponse.json([]);
  }
}

export async function POST(req: Request) {
  const { error } = await requireRoles(["OWNER", "ADMIN"]);
  if (error) return error;
  return withDb(async () => {
    const b = await req.json();
    if (!b.foto) return NextResponse.json({ error: "Foto wajib" }, { status: 400 });
    const data = await prisma.galeri.create({ data: { foto: b.foto, judul: b.judul ?? "" } });
    return NextResponse.json(data);
  }, { logTag: "cms/galeri" });
}

export async function PUT(req: Request) {
  const { error } = await requireRoles(["OWNER", "ADMIN"]);
  if (error) return error;
  return withDb(async () => {
    const b = await req.json();
    const data = await prisma.galeri.update({ where: { id: b.id }, data: { tampil: b.tampil, judul: b.judul, foto: b.foto } });
    return NextResponse.json(data);
  }, { logTag: "cms/galeri" });
}

export async function DELETE(req: Request) {
  const { error } = await requireRoles(["OWNER", "ADMIN"]);
  if (error) return error;
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "no id" }, { status: 400 });
  return withDb(async () => {
    await prisma.galeri.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  }, { logTag: "cms/galeri" });
}

