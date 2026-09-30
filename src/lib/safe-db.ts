export async function safeDb<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    // Jangan bikin 500 di Vercel saat DB unreachable / tabel belum migrate.
    // Log ke server logs Vercel agar bisa ditelusuri.
    console.error("[db-safe] query gagal, pakai fallback:", (e as Error)?.message ?? e);
    return fallback;
  }
}
