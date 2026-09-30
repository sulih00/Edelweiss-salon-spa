import { createClient } from "@supabase/supabase-js";

// Client server-side untuk upload file ke Supabase Storage.
// Memakai anon key + policy bucket "bukti" (insert/select publik).
// Jangan taruh service_role key di sini.
export function supabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase URL/key belum di-setting");
  return createClient(url, key);
}

export const BUKTI_BUCKET = "bukti";
