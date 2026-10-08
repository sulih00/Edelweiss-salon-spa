"use client";

import { useState } from "react";
import Link from "next/link";
import { TableShell, Th, Td, Badge } from "@/components/admin";
import { rupiah } from "@/lib/utils";

type KatRow = {
  kategori: string;
  tipe: string;
  _count: number;
  _sum: { jumlah: number | null };
};

type BookingRow = {
  id: string;
  status: string;
  diskon: number | null;
  pelanggan: { nama: string };
  produk: { nama: string; harga: number };
};

export default function LaporanClient({
  katGroup,
  bookings,
}: {
  katGroup: KatRow[];
  bookings: BookingRow[];
}) {
  // Sorting for Kategori table
  const [katSortCol, setKatSortCol] = useState<string>("kategori");
  const [katSortDir, setKatSortDir] = useState<"asc" | "desc">("asc");

  const handleKatSort = (col: string) => {
    if (katSortCol === col) setKatSortDir(katSortDir === "asc" ? "desc" : "asc");
    else { setKatSortCol(col); setKatSortDir("asc"); }
  };

  const sortedKat = [...katGroup].sort((a, b) => {
    let valA: string | number = (a[katSortCol as keyof KatRow] ?? "") as string | number;
    let valB: string | number = (b[katSortCol as keyof KatRow] ?? "") as string | number;

    if (katSortCol === "jumlah") {
      valA = a._sum.jumlah ?? 0;
      valB = b._sum.jumlah ?? 0;
    }

    if (typeof valA === "string") {
      const cmp = String(valA).localeCompare(String(valB));
      return katSortDir === "asc" ? cmp : -cmp;
    }
    const cmp = Number(valA) - Number(valB);
    return katSortDir === "asc" ? cmp : -cmp;
  });

  // Sorting for Bookings table
  const [bSortCol, setBSortCol] = useState<string>("pelanggan");
  const [bSortDir, setBSortDir] = useState<"asc" | "desc">("asc");

  const handleBSort = (col: string) => {
    if (bSortCol === col) setBSortDir(bSortDir === "asc" ? "desc" : "asc");
    else { setBSortCol(col); setBSortDir("asc"); }
  };

  const sortedBookings = [...bookings].sort((a, b) => {
    let valA: string | number = "";
    let valB: string | number = "";

    if (bSortCol === "pelanggan") {
      valA = a.pelanggan.nama;
      valB = b.pelanggan.nama;
    } else if (bSortCol === "total") {
      valA = Math.max(0, a.produk.harga - (a.diskon ?? 0));
      valB = Math.max(0, b.produk.harga - (b.diskon ?? 0));
    } else if (bSortCol === "status") {
      valA = a.status;
      valB = b.status;
    }

    if (typeof valA === "string") {
      const cmp = String(valA).localeCompare(String(valB));
      return bSortDir === "asc" ? cmp : -cmp;
    }
    const cmp = Number(valA) - Number(valB);
    return bSortDir === "asc" ? cmp : -cmp;
  });

  return (
    <div className="mt-4 grid gap-4 xl:grid-cols-2">
      {/* Table 1: Per Kategori */}
      <div className="rounded-2xl border border-stone-200/70 bg-white shadow-sm">
        <div className="border-b border-stone-200 px-5 py-4">
          <h2 className="font-bold text-stone-900">Per Kategori Transaksi</h2>
        </div>
        <TableShell>
          <thead>
            <tr>
              <Th sortable sortDirection={katSortCol === "kategori" ? katSortDir : null} onSort={() => handleKatSort("kategori")}>Kategori</Th>
              <Th sortable sortDirection={katSortCol === "tipe" ? katSortDir : null} onSort={() => handleKatSort("tipe")}>Tipe</Th>
              <Th sortable sortDirection={katSortCol === "_count" ? katSortDir : null} onSort={() => handleKatSort("_count")} className="text-right">Transaksi</Th>
              <Th sortable sortDirection={katSortCol === "jumlah" ? katSortDir : null} onSort={() => handleKatSort("jumlah")} className="text-right">Total</Th>
            </tr>
          </thead>
          <tbody>
            {sortedKat.map((k, i) => (
              <tr key={i} className="transition hover:bg-stone-50">
                <Td className="font-semibold">{k.kategori}</Td>
                <Td><Badge tone={k.tipe === "MASUK" ? "green" : "red"}>{k.tipe}</Badge></Td>
                <Td className="text-right text-stone-500">{k._count}x</Td>
                <Td className="text-right font-bold">{rupiah(k._sum.jumlah ?? 0)}</Td>
              </tr>
            ))}
          </tbody>
        </TableShell>
        {sortedKat.length === 0 && (
          <p className="px-5 py-6 text-center text-sm text-stone-400">Belum ada transaksi bulan ini.</p>
        )}
      </div>

      {/* Table 2: Booking Bulan Ini */}
      <div className="rounded-2xl border border-stone-200/70 bg-white shadow-sm">
        <div className="border-b border-stone-200 px-5 py-4">
          <h2 className="font-bold text-stone-900">Booking Bulan Ini</h2>
        </div>
        <TableShell>
          <thead>
            <tr>
              <Th sortable sortDirection={bSortCol === "pelanggan" ? bSortDir : null} onSort={() => handleBSort("pelanggan")}>Pelanggan</Th>
              <Th sortable sortDirection={bSortCol === "total" ? bSortDir : null} onSort={() => handleBSort("total")}>Total</Th>
              <Th sortable sortDirection={bSortCol === "status" ? bSortDir : null} onSort={() => handleBSort("status")}>Status</Th>
              <Th className="text-right">Nota</Th>
            </tr>
          </thead>
          <tbody>
            {sortedBookings.map((b) => (
              <tr key={b.id} className="transition hover:bg-stone-50">
                <Td>
                  <p className="font-semibold text-stone-900">{b.pelanggan.nama}</p>
                  <p className="text-xs text-stone-400">{b.produk.nama}</p>
                </Td>
                <Td className="font-semibold">{rupiah(Math.max(0, b.produk.harga - (b.diskon ?? 0)))}</Td>
                <Td><Badge tone={b.status === "SELESAI" ? "green" : b.status === "BATAL" ? "red" : "gold"}>{b.status}</Badge></Td>
                <Td className="text-right">
                  {b.status === "SELESAI" ? (
                    <Link href={`/cms/struk/${b.id}`} className="rounded-lg border border-stone-200 px-2.5 py-1.5 text-xs font-semibold text-stone-600 hover:border-sage-600 hover:text-sage-700">
                      Struk
                    </Link>
                  ) : <span className="text-xs text-stone-300">—</span>}
                </Td>
              </tr>
            ))}
          </tbody>
        </TableShell>
        {sortedBookings.length === 0 && (
          <p className="px-5 py-6 text-center text-sm text-stone-400">Belum ada booking bulan ini.</p>
        )}
      </div>
    </div>
  );
}
