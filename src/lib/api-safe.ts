import { NextResponse } from "next/server";

/** True jika error berasal dari koneksi DB (bukan salah input user). */
export function isDbDown(e: unknown): boolean {
  const msg = `${(e as Error)?.message ?? ""} ${(e as { code?: string })?.code ?? ""}`;
  return /P1000|P1001|P1002|P1017|can't reach|timed out|timeout|ECONNREFUSED|ENOTFOUND|EAI_AGAIN|authentication failed|connect|connection|pool/i.test(
    msg
  );
}

/** Sanitasi pesan error agar tidak menampilkan pesan teknis mentah (Prisma/DB/Zod) ke user. */
export function sanitizeError(e: unknown): string {
  if (!e) return "Terjadi kesalahan pada sistem.";
  const rawMsg = e instanceof Error ? e.message : String(e);

  // Jika pesan memuat istilah teknis internal, ubah jadi kalimat sopan
  if (/prisma|invocation|unique constraint|foreign key|syntax error|table|column|zod|validation|invalid|object|stack/i.test(rawMsg)) {
    return "Terjadi kendala saat memproses data. Silakan coba beberapa saat lagi.";
  }

  return rawMsg;
}

/** Response 503 standar saat Supabase tidak terjangkau. */
export function dbDownRes(e: unknown) {
  console.error("[api] Database Supabase tidak terjangkau / timeout:", (e as Error)?.message ?? e);
  return NextResponse.json(
    { error: "Koneksi sistem sedang dalam pemeliharaan berkala. Silakan coba beberapa saat lagi." },
    { status: 503 }
  );
}

/** Bungkus handler API: error koneksi DB -> 503 ramah user, error lain -> 500 tersanitasi. */
export async function withDb(
  fn: () => Promise<NextResponse>,
  opts?: { logTag?: string }
): Promise<NextResponse> {
  try {
    return await fn();
  } catch (e) {
    if (isDbDown(e)) {
      console.error(`[api${opts?.logTag ? `/${opts.logTag}` : ""}] DB down:`, (e as Error)?.message ?? e);
      return dbDownRes(e);
    }
    console.error(`[api${opts?.logTag ? `/${opts.logTag}` : ""}] error:`, e);
    return NextResponse.json({ error: sanitizeError(e) }, { status: 500 });
  }
}

