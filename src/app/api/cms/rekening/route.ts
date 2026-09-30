import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withDb } from "@/lib/api-safe";
import { requireAuth } from "@/lib/roles";
import { requireRoles } from "@/lib/roles";

export async function GET() {
  const a = await requireAuth(); if (a) return a;
  try {
    const data = await prisma.rekening.findMany({ orderBy: [{ urutan: "asc" }, { createdAt: "asc" }] });
    return NextResponse.json(data);
  } catch (e) {
    console.error("[api/cms/rekening] DB gagal:", (e as Error)?.message ?? e);
    return NextResponse.json([]);
  }
}

export async function POST(req: Request) {
  const { error } = await requireRoles(["OWNER", "ADMIN"]);
  if (error) return error;
  return withDb(async () => {
    const b = await req.json();
    if (!b.bank || !b.nomor || !b.atasNama)
      return NextResponse.json({ error: "Bank, nomor, dan atas nama wajib diisi" }, { status: 400 });
    const maxUrut = await prisma.rekening.aggregate({ _max: { urutan: true } });
    const data = await prisma.rekening.create({
      data: {
        bank: b.bank,
        nomor: String(b.nomor).trim(),
        atasNama: b.atasNama,
        urutan: b.urutan != null && b.urutan !== "" ? Number(b.urutan) : (maxUrut._max.urutan ?? 0) + 1,
        aktif: b.aktif !== false,
      },
    });
    return NextResponse.json(data);
  }, { logTag: "cms/rekening" });
}

export async function PUT(req: Request) {
  const { error } = await requireRoles(["OWNER", "ADMIN"]);
  if (error) return error;
  return withDb(async () => {
    const b = await req.json();
    const { id, ...rest } = b;
    const data = await prisma.rekening.update({
      where: { id },
      data: {
        ...("bank" in rest ? { bank: rest.bank } : {}),
        ...("nomor" in rest ? { nomor: String(rest.nomor).trim() } : {}),
        ...("atasNama" in rest ? { atasNama: rest.atasNama } : {}),
        ...("urutan" in rest && rest.urutan !== "" ? { urutan: Number(rest.urutan) } : {}),
        ...("aktif" in rest ? { aktif: !!rest.aktif } : {}),
      },
    });
    return NextResponse.json(data);
  }, { logTag: "cms/rekening" });
}

export async function DELETE(req: Request) {
  const { error } = await requireRoles(["OWNER", "ADMIN"]);
  if (error) return error;
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "no id" }, { status: 400 });
  return withDb(async () => {
    await prisma.rekening.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  }, { logTag: "cms/rekening" });
}
