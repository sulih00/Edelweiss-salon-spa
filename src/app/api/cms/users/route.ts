import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withDb } from "@/lib/api-safe";
import { requireRoles } from "@/lib/roles";
import bcrypt from "bcryptjs";

export async function GET() {
  const { error } = await requireRoles(["OWNER"]);
  if (error) return error;
  try {
    const users = await prisma.user.findMany({ select: { id: true, name: true, email: true, role: true, createdAt: true }, orderBy: { createdAt: "asc" } });
    return NextResponse.json(users);
  } catch (e) {
    console.error("[api/cms/users] DB gagal:", (e as Error)?.message ?? e);
    return NextResponse.json([]);
  }
}

export async function POST(req: Request) {
  const { error } = await requireRoles(["OWNER"]);
  if (error) return error;
  return withDb(async () => {
    const b = await req.json();
    if (!b.email || !b.password || !b.name) return NextResponse.json({ error: "Lengkapi nama/email/password" }, { status: 400 });
    const exists = await prisma.user.findUnique({ where: { email: String(b.email).toLowerCase() } });
    if (exists) return NextResponse.json({ error: "Email sudah dipakai" }, { status: 400 });
    const user = await prisma.user.create({
      data: {
        name: b.name,
        email: String(b.email).toLowerCase(),
        passwordHash: await bcrypt.hash(b.password, 10),
        role: ["KASIR", "ADMIN", "OWNER", "USER"].includes(b.role) ? b.role : "USER",
      },
      select: { id: true, name: true, email: true, role: true },
    });
    return NextResponse.json(user);
  }, { logTag: "cms/users" });
}

export async function DELETE(req: Request) {
  const { error, session } = await requireRoles(["OWNER"]);
  if (error) return error;
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "no id" }, { status: 400 });
  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
  if (target.email === session?.email) return NextResponse.json({ error: "Tidak bisa hapus diri sendiri" }, { status: 400 });
  // Jangan sampai tidak ada OWNER tersisa (transaksi SetNull tetap aman, tapi akses OWNER harus ada)
  if (target.role === "OWNER") {
    const ownerCount = await prisma.user.count({ where: { role: "OWNER" } });
    if (ownerCount <= 1) return NextResponse.json({ error: "Tidak bisa hapus OWNER terakhir." }, { status: 409 });
  }
  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
