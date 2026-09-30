import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Cek cepat: /api/health -> { ok, db: 'up'|'down', produk, user, hint }
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    const [produk, user] = await Promise.all([prisma.produk.count(), prisma.user.count()]);
    return NextResponse.json({ ok: true, db: "up", produk, user });
  } catch (e) {
    const msg = (e as Error)?.message ?? String(e);
    console.error("[api/health] DB down:", msg);
    return NextResponse.json(
      {
        ok: false,
        db: "down",
        hint: "Cek DATABASE_URL di Vercel: tanpa kutip/spasi, username postgres.kyiuhnovgtcilpjahhzw, host aws-0-ap-southeast-1.pooler.supabase.com:6543, password di-encode bila ada @#:/?&.",
        error: msg.split("\n")[0],
      },
      { status: 503 }
    );
  }
}
