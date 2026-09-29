// Tipe rekening — datanya kini dari database (CMS → Rekening),
// bukan lagi hardcoded di sini.
export type Rekening = { bank: string; nomor: string; atasNama: string };

export const DP_MINIMAL = 300000; // treatment >= ini disarankan DP 30%
