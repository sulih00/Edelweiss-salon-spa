import { NextResponse } from "next/server";
import { requireRoles } from "@/lib/roles";
import path from "path";
import crypto from "crypto";
import { supabaseServer, BUKTI_BUCKET } from "@/lib/supabase";

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
    const name = "cms-" + crypto.randomBytes(12).toString("hex") + ext;
    const supa = supabaseServer();
    const { error: upErr } = await supa.storage.from(BUKTI_BUCKET).upload(name, bytes, {
      contentType: file.type || "image/jpeg",
      upsert: false,
    });
    if (upErr) throw new Error(upErr.message);
    const { data } = supa.storage.from(BUKTI_BUCKET).getPublicUrl(name);
    return NextResponse.json({ url: data.publicUrl });
  } catch (err) {
    console.error("Gagal upload file:", err);
    return NextResponse.json({ error: "Gagal memproses file upload" }, { status: 500 });
  }
}

