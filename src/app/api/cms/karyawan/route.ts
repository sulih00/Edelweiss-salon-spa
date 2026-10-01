import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { withDb } from "@/lib/api-safe";
import { requireRoles } from "@/lib/roles";

export async function GET() {
  const s = await getServerSession(authOptions);
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const [karyawan, kategori] = await Promise.all([
      prisma.karyawan.findMany({ orderBy: { nama: "asc" } }),
      prisma.kategoriProduk.findMany(),
    ]);
    return NextResponse.json({ karyawan, kategori });
  } catch (e) {
    console.error("[api/cms/karyawan] DB gagal:", (e as Error)?.message ?? e);
    return NextResponse.json({ karyawan: [], kategori: [] });
  }
}

export async function POST(req: Request) {
  const { error } = await requireRoles(["OWNER", "ADMIN"]);
  if (error) return error;
  return withDb(async () => {
    const b = await req.json();
    const data = await prisma.karyawan.create({
      data: { nama: b.nama, jabatan: b.jabatan ?? "Terapis", telepon: b.telepon ?? "", komisiPersen: Number(b.komisiPersen ?? 0) },
    });
    return NextResponse.json(data);
  }, { logTag: "cms/karyawan" });
}

export async function PUT(req: Request) {
  const { error } = await requireRoles(["OWNER", "ADMIN"]);
  if (error) return error;
  return withDb(async () => {
    const b = await req.json();
    const { id, nama, jabatan, telepon, komisiPersen } = b;
    if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

    const updateData: Record<string, unknown> = {};
    if (nama !== undefined) updateData.nama = String(nama).trim();
    if (jabatan !== undefined) updateData.jabatan = String(jabatan).trim();
    if (telepon !== undefined) updateData.telepon = String(telepon).trim();
    if (komisiPersen !== undefined) updateData.komisiPersen = Number(komisiPersen);

    const data = await prisma.karyawan.update({ where: { id }, data: updateData });
    return NextResponse.json(data);
  }, { logTag: "cms/karyawan" });
}

export async function DELETE(req: Request) {
  const { error } = await requireRoles(["OWNER", "ADMIN"]);
  if (error) return error;
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "no id" }, { status: 400 });
  return withDb(async () => {
    const dipasang = await prisma.booking.count({ where: { karyawanId: id } });
    if (dipasang > 0) {
      return NextResponse.json(
        { error: `Tidak dapat menghapus karyawan yang pernah menangani ${dipasang} transaksi booking.` },
        { status: 409 }
      );
    }
    await prisma.karyawan.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  }, { logTag: "cms/karyawan" });
}
