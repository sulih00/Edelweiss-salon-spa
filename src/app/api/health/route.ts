import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Cek cepat: /api/health -> { ok, db: 'up'|'down', ...diagnosa aman (tanpa password) }
function safeParse(url?: string) {
  if (!url) return { present: false };
  try {
    const u = new URL(url);
    return {
      present: true,
      protocol: u.protocol,
      user: u.username,
      host: u.hostname,
      port: u.port,
      db: u.pathname.replace(/^\//, ""),
      params: u.search,
      hasPassword: u.password.length > 0,
    };
  } catch {
    return { present: true, parseError: true };
  }
}

export async function GET() {
  const env = {
    DATABASE_URL: safeParse(process.env.DATABASE_URL),
    DIRECT_URL: safeParse(process.env.DIRECT_URL),
    NEXTAUTH_URL: process.env.NEXTAUTH_URL ?? null,
    hasNEXTAUTH_SECRET: (process.env.NEXTAUTH_SECRET ?? "").length > 0,
  };
  try {
    await prisma.$queryRaw`SELECT 1`;
    const [produk, user] = await Promise.all([prisma.produk.count(), prisma.user.count()]);
    return NextResponse.json({ ok: true, db: "up", produk, user, env });
  } catch (e) {
    const err = e as { name?: string; message?: string; code?: string; meta?: unknown };
    let detail = "";
    try {
      detail = JSON.stringify(e, Object.getOwnPropertyNames(e as object)).slice(0, 800);
    } catch {
      detail = String(e).slice(0, 800);
    }
    console.error("[api/health] DB down:", err?.message ?? e);
    return NextResponse.json(
      {
        ok: false,
        db: "down",
        errName: err?.name ?? typeof e,
        errCode: err?.code ?? null,
        errMessage: (err?.message ?? "").split("\n").slice(0, 4),
        errDetail: detail,
        env,
        hint: "Bandingkan host/user/port di atas dengan URI dari Supabase Dashboard > Settings > Database. Jika parseError/host beda = salah copy di Vercel.",
      },
      { status: 503 }
    );
  }
}
