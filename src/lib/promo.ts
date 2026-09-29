type PromoLike = {
  tipe: string;
  nilai: number;
  minBelanja: number;
  maxDiskon?: number | null;
  kuota?: number | null;
  terpakai: number;
  mulai: Date;
  berakhir?: Date | null;
  aktif: boolean;
};

export function cekPromo(p: PromoLike, harga: number): { ok: boolean; error?: string; diskon?: number } {
  if (!p.aktif) return { ok: false, error: "Promo tidak aktif" };
  const now = new Date();
  if (now < new Date(p.mulai)) return { ok: false, error: "Promo belum mulai" };
  if (p.berakhir && now > new Date(p.berakhir)) return { ok: false, error: "Promo sudah berakhir" };
  if (p.kuota != null && p.terpakai >= p.kuota) return { ok: false, error: "Kuota promo habis" };
  if (harga < p.minBelanja) return { ok: false, error: `Min belanja ${p.minBelanja.toLocaleString("id-ID")}` };
  let diskon = p.tipe === "PERSEN" ? Math.floor((harga * p.nilai) / 100) : p.nilai;
  if (p.maxDiskon != null) diskon = Math.min(diskon, p.maxDiskon);
  diskon = Math.min(diskon, harga);
  return { ok: true, diskon };
}

export function labelPromo(p: { tipe: string; nilai: number }) {
  return p.tipe === "PERSEN" ? `${p.nilai}%` : `Rp ${p.nilai.toLocaleString("id-ID")}`;
}
