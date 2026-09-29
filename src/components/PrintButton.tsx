"use client";
import { Printer } from "lucide-react";

export default function PrintButton({ label = "Cetak" }: { label?: string }) {
  return (
    <button
      onClick={() => window.print()}
      className="flex items-center gap-1.5 rounded-xl bg-sage-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sage-800 print:hidden"
    >
      <Printer size={16} /> {label}
    </button>
  );
}
