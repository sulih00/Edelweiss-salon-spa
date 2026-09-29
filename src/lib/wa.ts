export const WA_ADMIN = process.env.NEXT_PUBLIC_WA_ADMIN ?? "6282225642137";

export function waLink(phone: string, message: string) {
  const digits = phone.replace(/[^0-9]/g, "");
  // 08xx -> 628xx
  const normalized = digits.startsWith("08") ? "62" + digits.slice(1) : digits;
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}

export function pesanBookingBaru(nama: string, layanan: string, jadwal: string, buktiTF?: string | null) {
  let msg = `Halo Edelweiss Salon Spa! Saya ${nama}. Saya sudah booking ${layanan} untuk ${jadwal}.`;
  if (buktiTF) {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const fullUrl = buktiTF.startsWith("http") ? buktiTF : `${origin}${buktiTF}`;
    msg += `\n\nBukti Transfer: ${fullUrl}`;
  }
  msg += ` Mohon konfirmasi ya. Terima kasih.`;
  return msg;
}

export function pesanKonfirmasiAdmin(nama: string, layanan: string, jadwal: string) {
  return `Halo ${nama}, booking ${layanan} pada ${jadwal} di Edelweiss Salon Spa sudah KAMI KONFIRMASI. Sampai jumpa!`;
}

export function pesanStrukWA({
  noNota,
  nama,
  layanan,
  harga,
  diskon = 0,
  promoKode,
  total,
  jadwal,
  terapis,
  strukUrl,
}: {
  noNota: string;
  nama: string;
  layanan: string;
  harga: number;
  diskon?: number;
  promoKode?: string | null;
  total: number;
  jadwal: string;
  terapis?: string | null;
  strukUrl?: string | null;
}) {
  let msg = `🧾 *NOTA PEMBAYARAN EDELWEISS SALON SPA*\n`;
  msg += `No. Nota: *${noNota}*\n`;
  msg += `Tanggal: ${jadwal}\n`;
  msg += `Pelanggan: *${nama}*\n`;
  if (terapis) msg += `Terapis: ${terapis}\n`;
  msg += `\n*Detail Perawatan:*\n`;
  msg += `• ${layanan}: Rp ${harga.toLocaleString("id-ID")}\n`;
  if (diskon > 0) {
    msg += `• Diskon${promoKode ? ` (${promoKode})` : ""}: -Rp ${diskon.toLocaleString("id-ID")}\n`;
  }
  msg += `------------------------------\n`;
  msg += `*TOTAL BAYAR: Rp ${total.toLocaleString("id-ID")}*\n`;
  msg += `*Status: LUNAS / SELESAI*\n`;
  if (strukUrl) {
    msg += `\n🔗 Link Nota Digital:\n${strukUrl}\n`;
  }
  msg += `\nTerima kasih telah merawat diri di Edelweiss Salon Spa 🌿`;
  return msg;
}
