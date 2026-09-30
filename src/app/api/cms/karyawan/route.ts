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
