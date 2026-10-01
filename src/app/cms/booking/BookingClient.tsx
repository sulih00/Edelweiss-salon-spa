"use client";

import { useState, useMemo } from "react";
import { rupiah, formatTanggal } from "@/lib/utils";
import { waLink, pesanKonfirmasiAdmin, pesanStrukWA } from "@/lib/wa";
import { PageHeader, TableShell, Th, Td, Badge, FilterTabs, Pagination, Empty } from "@/components/admin";
import BookingActions from "./BookingActions";
import { Search } from "lucide-react";

type BookingItem = {
  id: string;
  jadwal: string;
  status: string;
  diskon: number;
  buktiTF?: string | null;
  nominalTF?: number | null;
  createdAt: string;
  pelanggan: { nama: string; wa: string };
  produk: { nama: string; harga: number };
  karyawan?: { nama: string } | null;
  promo?: { kode: string } | null;
};

const statusTone = (s: string) =>
  (s === "BARU" ? "gold" : s === "SELESAI" ? "green" : s === "BATAL" ? "red" : "sage") as "gold" | "green" | "red" | "sage";

export default function BookingClient({ data }: { data: BookingItem[] }) {
  const [q, setQ] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("semua");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const filtered = useMemo(() => {
    return data.filter((b) => {
      const matchQ =
        b.pelanggan.nama.toLowerCase().includes(q.toLowerCase()) ||
        b.pelanggan.wa.includes(q) ||
        b.produk.nama.toLowerCase().includes(q.toLowerCase());
      const matchStatus = filterStatus === "semua" || b.status === filterStatus;
      return matchQ && matchStatus;
    });
  }, [data, q, filterStatus]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = useMemo(() => {
    return filtered.slice((page - 1) * pageSize, page * pageSize);
  }, [filtered, page, pageSize]);

  return (
    <div className="space-y-4">
      <PageHeader title="Booking & Jadwal" desc={`${data.length} booking terdaftar.`} />

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <FilterTabs
          value={filterStatus}
          onChange={(v) => {
            setFilterStatus(v);
            setPage(1);
          }}
          options={[
            { value: "semua", label: "Semua", count: data.length },
            { value: "BARU", label: "Baru", count: data.filter((b) => b.status === "BARU").length },
            { value: "DIKONFIRMASI", label: "Dikonfirmasi", count: data.filter((b) => b.status === "DIKONFIRMASI").length },
            { value: "SELESAI", label: "Selesai", count: data.filter((b) => b.status === "SELESAI").length },
            { value: "BATAL", label: "Batal", count: data.filter((b) => b.status === "BATAL").length },
          ]}
        />

        <div className="relative lg:w-64">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder="Cari pelanggan / layanan..."
            className="w-full rounded-2xl border border-stone-200/70 bg-white py-2 pl-10 pr-4 text-xs font-medium shadow-sm outline-none focus:border-sage-600"
          />
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <Empty text="Tidak ada data booking yang sesuai filter." />
      ) : (
        <>
          <TableShell>
            <thead>
              <tr>
                <Th>Pelanggan</Th>
                <Th>Layanan</Th>
                <Th>Jadwal</Th>
                <Th className="text-right">Total</Th>
                <Th>Status</Th>
                <Th>Bukti TF</Th>
                <Th className="text-right">Aksi</Th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((b) => {
                const total = Math.max(0, b.produk.harga - (b.diskon ?? 0));
                const createdAtYear = new Date(b.createdAt).getFullYear();
                const noNota = `EWS-${createdAtYear}-${b.id.slice(-6).toUpperCase()}`;
                const tglFormatted = formatTanggal(new Date(b.jadwal));

                const waMsg =
                  b.status === "SELESAI"
                    ? pesanStrukWA({
                        noNota,
                        nama: b.pelanggan.nama,
                        layanan: b.produk.nama,
                        harga: b.produk.harga,
                        diskon: b.diskon ?? 0,
                        promoKode: b.promo?.kode,
                        total,
                        jadwal: tglFormatted,
                        terapis: b.karyawan?.nama,
                      })
                    : pesanKonfirmasiAdmin(b.pelanggan.nama, b.produk.nama, tglFormatted);

                const wa = waLink(b.pelanggan.wa, waMsg);

                return (
                  <tr key={b.id} className="transition hover:bg-stone-50">
                    <Td>
                      <p className="font-semibold text-stone-900">{b.pelanggan.nama}</p>
                      <p className="text-xs text-stone-400">{b.pelanggan.wa}</p>
                    </Td>
                    <Td>
                      <p className="font-semibold text-stone-900">{b.produk.nama}</p>
                      <p className="text-xs text-stone-500">
                        {b.karyawan ? `👤 ${b.karyawan.nama}` : "✨ Terapis bebas"}
                      </p>
                      {b.promo && (
                        <span className="mt-0.5 inline-block rounded bg-gold-400/20 px-1.5 py-0.5 text-[11px] font-bold text-gold-600">
                          🎟 {b.promo.kode}
                        </span>
                      )}
                    </Td>
                    <Td className="whitespace-nowrap text-stone-500">{tglFormatted}</Td>
                    <Td className="text-right">
                      {b.diskon > 0 ? (
                        <span>
                          <span className="text-xs text-stone-400 line-through">{rupiah(b.produk.harga)}</span>
                          <br />
                          <b className="text-sage-700">{rupiah(total)}</b>
                        </span>
                      ) : (
                        <b>{rupiah(b.produk.harga)}</b>
                      )}
                    </Td>
                    <Td>
                      <Badge tone={statusTone(b.status)}>{b.status}</Badge>
                    </Td>
                    <Td>
                      <div className="flex flex-col gap-1 items-start">
                        {b.buktiTF && (
                          <a href={b.buktiTF} target="_blank" rel="noreferrer">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={b.buktiTF}
                              alt="Bukti"
                              className="h-10 w-10 rounded-lg border object-cover transition hover:scale-110"
                            />
                          </a>
                        )}
                        {b.nominalTF && b.nominalTF > 0 ? (
                          <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-200">
                            💳 DEBIT {rupiah(b.nominalTF)}
                          </span>
                        ) : !b.buktiTF ? (
                          <span className="text-xs text-stone-300">—</span>
                        ) : null}
                      </div>
                    </Td>
                    <Td className="text-right">
                      <div className="flex justify-end gap-1.5">
                        <BookingActions id={b.id} status={b.status} />
                        {b.status === "SELESAI" ? (
                          <a
                            href={`/cms/struk/${b.id}`}
                            className="whitespace-nowrap rounded-lg bg-[#25D366] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-green-600"
                          >
                            📸 Struk WA (Gambar)
                          </a>
                        ) : (
                          <a
                            href={wa}
                            target="_blank"
                            rel="noreferrer"
                            className="whitespace-nowrap rounded-lg bg-[#25D366] px-2.5 py-1.5 text-xs font-semibold text-white"
                          >
                            WA
                          </a>
                        )}
                      </div>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </TableShell>

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            totalItems={filtered.length}
            pageSize={pageSize}
          />
        </>
      )}
    </div>
  );
}
