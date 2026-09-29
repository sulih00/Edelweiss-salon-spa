import { NextResponse } from "next/server";
import { requireRoles } from "@/lib/roles";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";

const MAX = 2 * 1024 * 1024; // 2MB
const ALLOWED_EXTS = [".jpg", ".jpeg", ".png", ".webp"];

export async function POST(req: Request) {
  const { error } = await requireRoles(["OWNER", "ADMIN", "KASIR"]);
  if (error) return error;

  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "Tidak ada file" }, { status: 400 });
    if (!file.type.startsWith("image/")) return NextResponse.json({ error: "Hanya file gambar yang diperbolehkan" }, { status: 400 });
    if (file.size > MAX) return NextResponse.json({ error: "Maksimal ukuran file 2MB" }, { status: 400 });

    const ext = (path.extname(file.name) || ".jpg").toLowerCase();
    if (!ALLOWED_EXTS.includes(ext)) {
      return NextResponse.json({ error: "Format gambar harus JPG, PNG, atau WEBP" }, { status: 400 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const name = crypto.randomBytes(12).toString("hex") + ext;
    const dir = path.join(process.cwd(), "public", "uploads");
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, name), bytes);
    return NextResponse.json({ url: `/uploads/${name}` });
  } catch (err) {
    console.error("Gagal upload file:", err);
    return NextResponse.json({ error: "Gagal memproses file upload" }, { status: 500 });
  }
}

