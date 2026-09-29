"use client";
import * as XLSX from "xlsx";
import { FileSpreadsheet } from "lucide-react";

export type LaporanRow = { tanggal: string; keterangan: string; kategori: string; tipe: string; jumlah: number };

export default function LaporanExport({ bulan, rows }: { bulan: string; rows: LaporanRow[] }) {
  function exportExcel() {
    const ws = XLSX.utils.json_to_sheet(
      rows.map((r) => ({ Tanggal: r.tanggal, Keterangan: r.keterangan, Kategori: r.kategori, Tipe: r.tipe, Jumlah: r.jumlah }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, bulan);
    XLSX.writeFile(wb, `laporan-edelweiss-${bulan}.xlsx`);
  }
  return (
    <button
      onClick={exportExcel}
      className="flex items-center gap-1.5 rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-600 transition hover:border-sage-600 print:hidden"
    >
      <FileSpreadsheet size={16} /> Excel
    </button>
  );
}
