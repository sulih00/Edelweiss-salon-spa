import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";

const MAX = 2 * 1024 * 1024; // 2MB
const ALLOWED_EXTS = [".jpg", ".jpeg", ".png", ".webp"];

// Upload publik untuk bukti transfer booking (tanpa login).
export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "Tidak ada file" }, { status: 400 });
    if (!file.type.startsWith("image/")) return NextResponse.json({ error: "File harus gambar (JPG/PNG/WEBP)" }, { status: 400 });
    if (file.size > MAX) return NextResponse.json({ error: "Maksimal 2MB" }, { status: 400 });

    const ext = (path.extname(file.name) || ".jpg").toLowerCase();
    if (!ALLOWED_EXTS.includes(ext)) {
      return NextResponse.json({ error: "Format gambar harus JPG, PNG, atau WEBP" }, { status: 400 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const name = "tf-" + crypto.randomBytes(10).toString("hex") + ext;
    const dir = path.join(process.cwd(), "public", "uploads");
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, name), bytes);
    return NextResponse.json({ url: `/uploads/${name}` });
  } catch (err) {
    console.error("Upload bukti transfer error:", err);
    return NextResponse.json({ error: "Gagal mengunggah bukti transfer" }, { status: 500 });
  }
}

