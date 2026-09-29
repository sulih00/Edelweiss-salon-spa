"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { toPng } from "html-to-image";
import { ArrowLeft, Send, Download, Printer, CheckCircle, Copy } from "lucide-react";
import { rupiah } from "@/lib/utils";

interface StrukItem {
  id: string;
  nama: string;
  harga: number;
  diskon: number;
  terapisNama?: string | null;
}

interface StrukData {
  id: string;
  noNota: string;
  tanggalStr: string;
  pelangganNama: string;
  pelangganWa: string;
  terapisNama?: string | null;
  items?: StrukItem[];
  layananNama?: string;
  harga?: number;
  subtotal?: number;
  diskonTotal?: number;
  diskon?: number;
  promoKode?: string | null;
  grandTotal?: number;
  total?: number;
  status: string;
  catatan?: string | null;
  transaksiList?: Array<{ tipe: string; kategori: string; jumlah: number; keterangan?: string | null }>;
}

export default function StrukClientView({ data }: { data: StrukData }) {
  const strukRef = useRef<HTMLDivElement>(null);
  const [loadingWa, setLoadingWa] = useState(false);
  const [loadingDownload, setLoadingDownload] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 5000);
  };

  const getWaLink = () => {
    const digits = data.pelangganWa.replace(/[^0-9]/g, "");
    const normalized = digits.startsWith("08") ? "62" + digits.slice(1) : digits;
    return `https://wa.me/${normalized}`;
  };

  // Convert receipt DOM to PNG blob
  const generatePngBlob = async (): Promise<{ blob: Blob; dataUrl: string } | null> => {
    if (!strukRef.current) return null;
    try {
      const dataUrl = await toPng(strukRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
        skipFonts: true,
      });
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      return { blob, dataUrl };
    } catch (err) {
      console.warn("Retrying toPng without font embedding...", err);
      try {
        const dataUrl = await toPng(strukRef.current, { backgroundColor: "#ffffff" });
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        return { blob, dataUrl };
      } catch (err2) {
        console.error("Gagal total membuat gambar struk:", err2);
        return null;
      }
    }
  };

  // Download image file
  const handleDownload = async () => {
    setLoadingDownload(true);
    const result = await generatePngBlob();
    setLoadingDownload(false);
    if (!result) {
      showToast("❌ Gagal mengunduh gambar struk.");
      return;
    }
    const link = document.createElement("a");
    link.download = `Struk-${data.noNota}.png`;
    link.href = result.dataUrl;
    link.click();
    showToast("✅ Gambar struk (.png) berhasil diunduh!");
  };

  // Send Image via WA (Copy to clipboard & open WA safely)
  const handleSendWaImage = async () => {
    setLoadingWa(true);
    const result = await generatePngBlob();
    setLoadingWa(false);

    if (!result) {
      showToast("❌ Gagal memproses gambar struk.");
      return;
    }

    let copied = false;
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard && typeof ClipboardItem !== "undefined") {
        const item = new ClipboardItem({ "image/png": result.blob });
        await navigator.clipboard.write([item]);
        copied = true;
      }
    } catch (e) {
      console.warn("Clipboard copy unsupported or blocked:", e);
    }

    if (copied) {
      showToast("📸 GAMBAR STRUK DISALIN! Silakan tekan Ctrl+V / Paste di WhatsApp.");
    } else {
      const link = document.createElement("a");
      link.download = `Struk-${data.noNota}.png`;
      link.href = result.dataUrl;
      link.click();
      showToast("📁 Gambar struk otomatis diunduh! Lampirkan file tersebut di WhatsApp.");
    }

    setTimeout(() => {
      window.open(getWaLink(), "_blank");
    }, 600);
  };

  // Calculate items list
  const itemList: StrukItem[] =
    data.items && data.items.length > 0
      ? data.items
      : [
          {
            id: data.id,
            nama: data.layananNama || "Perawatan Salon",
            harga: data.harga || 0,
            diskon: data.diskon || 0,
            terapisNama: data.terapisNama,
          },
        ];

  const safeNum = (val: unknown, fallback: number) => {
    const num = Number(val);
    return !isNaN(num) ? num : fallback;
  };

  const calculatedSubtotal = itemList.reduce((acc, it) => acc + safeNum(it.harga, 0), 0);
  const calculatedDiskonTotal = itemList.reduce((acc, it) => acc + safeNum(it.diskon, 0), 0);

  const subtotal = safeNum(data.subtotal, calculatedSubtotal);
  const diskonTotal = safeNum(data.diskonTotal, calculatedDiskonTotal);
  const grandTotal = safeNum(data.grandTotal ?? data.total, Math.max(0, subtotal - diskonTotal));

  return (
    <div className="mx-auto max-w-xl">
      {/* Top Navbar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link
          href="/cms/booking"
          className="flex items-center gap-1.5 text-sm font-medium text-stone-600 transition hover:text-sage-700"
        >
          <ArrowLeft size={16} /> Kembali ke Booking
        </Link>
        <span className="rounded-full bg-sage-50 px-3 py-1 text-xs font-semibold text-sage-800 border border-sage-200">
          Struk Nota #{data.noNota}
        </span>
      </div>

      {/* Action Buttons Header */}
      <div className="mb-6 rounded-2xl border border-stone-200/80 bg-white p-4 shadow-sm print:hidden">
        <p className="mb-3 text-xs font-semibold text-stone-500 uppercase tracking-wider">
          Opsi Pengiriman Struk Pelanggan:
        </p>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          <button
            type="button"
            onClick={handleSendWaImage}
            disabled={loadingWa}
            className="flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-green-600 hover:shadow-lg disabled:opacity-50"
          >
            {loadingWa ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <>
                <Send size={15} /> Kirim Gambar ke WA
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleDownload}
            disabled={loadingDownload}
            className="flex items-center justify-center gap-2 rounded-xl border border-stone-300 bg-stone-50 px-4 py-2.5 text-xs font-bold text-stone-700 transition hover:bg-stone-100 hover:text-stone-900 disabled:opacity-50"
          >
            {loadingDownload ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-stone-600 border-t-transparent" />
            ) : (
              <>
                <Download size={15} /> Unduh Gambar (.png)
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center justify-center gap-2 rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-xs font-bold text-stone-700 transition hover:bg-stone-50 hover:text-stone-900"
          >
            <Printer size={15} /> Cetak Struk
          </button>
        </div>

        <div className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 p-2.5 text-[11px] text-amber-800 border border-amber-200/60">
          <Copy size={14} className="mt-0.5 shrink-0 text-amber-600" />
          <p>
            Klik <b>&quot;Kirim Gambar ke WA&quot;</b> untuk menyalin gambar struk otomatis ke clipboard &amp; membuka chat WhatsApp.
          </p>
        </div>
      </div>

      {/* Toast Alert */}
      {toastMsg && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-sage-900 p-3.5 text-xs font-medium text-white shadow-lg animate-in fade-in slide-in-from-top-2">
          <CheckCircle size={16} className="text-gold-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Printable Thermal Receipt Card */}
      <div className="flex justify-center">
        <div
          ref={strukRef}
          className="thermal-receipt w-full max-w-[380px] rounded-2xl border border-stone-200 bg-white p-7 shadow-lg print:max-w-none print:rounded-none print:border-0 print:shadow-none"
        >
          {/* Header Salon */}
          <div className="text-center">
            <h2 className="font-serif-display text-2xl font-bold tracking-wide text-sage-900">
              Edelweiss
            </h2>
            <p className="text-[10px] tracking-[0.35em] font-semibold text-gold-500 uppercase">
              SALON • SPA
            </p>
            <p className="mt-1 text-[11px] text-stone-400 leading-tight">
              Jl. Mawar No. 12 • WA: 0822-2564-2137
            </p>
          </div>

          <div className="my-4 border-t border-dashed border-stone-300" />

          {/* Receipt Info */}
          <div className="space-y-1.5 text-xs text-stone-600">
            <div className="flex justify-between">
              <span className="text-stone-400">No. Nota</span>
              <b className="font-mono text-stone-900">{data.noNota}</b>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-400">Tanggal</span>
              <span className="font-medium text-stone-800">{data.tanggalStr}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-400">Pelanggan</span>
              <span className="font-bold text-stone-900">{data.pelangganNama}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-400">No. WA</span>
              <span className="text-stone-700">{data.pelangganWa}</span>
            </div>
            <div className="flex justify-between items-center pt-1">
              <span className="text-stone-400">Status Pembayaran</span>
              <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-[10px] font-bold text-green-800 border border-green-200 uppercase">
                {data.status} / LUNAS
              </span>
            </div>
          </div>

          <div className="my-4 border-t border-dashed border-stone-300" />

          {/* Service & Product Item List */}
          <div className="space-y-3 text-xs">
            <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
              Rincian Perawatan &amp; Produk ({itemList.length})
            </p>
            {itemList.map((item, idx) => (
              <div key={item.id || idx} className="space-y-0.5">
                <div className="flex justify-between font-bold text-stone-900 text-xs">
                  <span>{item.nama}</span>
                  <span>{rupiah(item.harga)}</span>
                </div>
                {item.terapisNama && (
                  <p className="text-[11px] text-sage-800 font-medium">
                    👤 Terapis: {item.terapisNama}
                  </p>
                )}
              </div>
            ))}
          </div>

          <div className="my-4 border-t border-dashed border-stone-300" />

          {/* Subtotal, Diskon, Grand Total */}
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-stone-500">
              <span>Subtotal</span>
              <span>{rupiah(subtotal)}</span>
            </div>
            {diskonTotal > 0 && (
              <div className="flex justify-between text-rose-600 font-medium">
                <span>Diskon{data.promoKode ? ` (${data.promoKode})` : ""}</span>
                <span>−{rupiah(diskonTotal)}</span>
              </div>
            )}

            <div className="flex justify-between border-t border-dashed border-stone-300 pt-2.5 text-sm font-bold text-sage-900">
              <span>TOTAL BAYAR</span>
              <span className="text-sage-800 text-base">{rupiah(grandTotal)}</span>
            </div>

            {/* Catatan / Detail Pembayaran (Split / DP) */}
            {data.catatan && (
              <div className="mt-2 rounded-lg bg-stone-50 p-2 text-[11px] text-stone-600 border border-stone-200">
                <p className="font-semibold text-stone-800">Catatan Pembayaran:</p>
                <p>{data.catatan}</p>
              </div>
            )}
          </div>

          <div className="my-5 border-t border-dashed border-stone-300" />

          {/* Footer Note */}
          <div className="text-center">
            <p className="text-xs font-semibold text-sage-800">
              Terima kasih telah merawat diri di Edelweiss 🌿
            </p>
            <p className="mt-1 text-[10px] text-stone-400">
              Simpan struk digital ini sebagai bukti transaksi resmi
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
