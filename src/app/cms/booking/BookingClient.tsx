"use client";

import { useState, useMemo } from "react";
import { rupiah, formatTanggal } from "@/lib/utils";
import { waLink, pesanKonfirmasiAdmin, pesanStrukWA } from "@/lib/wa";
import { PageHeader, TableShell, Th, Td, Badge, FilterTabs, Pagination, Empty } from "@/components/admin";
import BookingActions from "./BookingActions";
import { Search, Receipt } from "lucide-react";
import { IconWhatsApp } from "@/components/SocialIcons";

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
  const [sortField, setSortField] = useState<string>("jadwal");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const filtered = useMemo(() => {
    const res = data.filter((b) => {
      const matchQ =
        b.pelanggan.nama.toLowerCase().includes(q.toLowerCase()) ||
        b.pelanggan.wa.includes(q) ||
        b.produk.nama.toLowerCase().includes(q.toLowerCase());
      const matchStatus = filterStatus === "semua" || b.status === filterStatus;
      return matchQ && matchStatus;
    });

    return res.sort((a, b) => {
      let valA: string | number = "";
      let valB: string | number = "";

      if (sortField === "pelanggan") {
        valA = a.pelanggan.nama;
        valB = b.pelanggan.nama;
      } else if (sortField === "produk") {
        valA = a.produk.nama;
        valB = b.produk.nama;
      } else if (sortField === "jadwal") {
        valA = new Date(a.jadwal).getTime();
        valB = new Date(b.jadwal).getTime();
      } else if (sortField === "total") {
        valA = Math.max(0, a.produk.harga - (a.diskon ?? 0));
        valB = Math.max(0, b.produk.harga - (b.diskon ?? 0));
      } else if (sortField === "karyawan") {
        valA = a.karyawan?.nama || "";
        valB = b.karyawan?.nama || "";
      } else if (sortField === "status") {
        valA = a.status;
        valB = b.status;
      }

      if (typeof valA === "string") {
        const cmp = valA.localeCompare(String(valB));
        return sortOrder === "asc" ? cmp : -cmp;
      }
      const cmp = Number(valA) - Number(valB);
      return sortOrder === "asc" ? cmp : -cmp;
    });
  }, [data, q, filterStatus, sortField, sortOrder]);

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = useMemo(() => {
    return filtered.slice((page - 1) * pageSize, page * pageSize);
  }, [filtered, page, pageSize]);

  return (
    <div className="space-y-4">
      <PageHeader title="Booking &amp; Jadwal" desc={`${data.length} booking terdaftar.`} />

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <FilterTabs
          value={filterStatus}
          onChange={(v) => {
            setFilterStatus(v);
            setPage(1);
          }}
          options={[
            { value: "SEMUA", label: "Semua", count: data.length },
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
                <Th sortable sortDirection={sortField === "pelanggan" ? sortOrder : null} onSort={() => handleSort("pelanggan")}>Pelanggan</Th>
                <Th sortable sortDirection={sortField === "produk" ? sortOrder : null} onSort={() => handleSort("produk")}>Layanan</Th>
                <Th sortable sortDirection={sortField === "jadwal" ? sortOrder : null} onSort={() => handleSort("jadwal")}>Jadwal</Th>
                <Th sortable sortDirection={sortField === "total" ? sortOrder : null} onSort={() => handleSort("total")} className="text-right">Total</Th>
                <Th sortable sortDirection={sortField === "status" ? sortOrder : null} onSort={() => handleSort("status")}>Status</Th>
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
                      <div className="flex justify-end items-center gap-1.5">
                        <BookingActions id={b.id} status={b.status} />
                        {b.status === "SELESAI" ? (
                          <a
                            href={`/cms/struk/${b.id}`}
                            title="Lihat Struk Digital"
                            className="inline-flex items-center justify-center rounded-xl bg-sage-700 p-2 text-white transition hover:bg-sage-800 shadow-xs cursor-pointer"
                          >
                            <Receipt size={15} />
                          </a>
                        ) : (
                          <a
                            href={wa}
                            target="_blank"
                            rel="noreferrer"
                            title="Kirim Pesan WhatsApp"
                            className="inline-flex items-center justify-center rounded-xl bg-[#25D366] p-2 text-white transition hover:bg-green-600 shadow-xs cursor-pointer"
                          >
                            <IconWhatsApp className="h-3.5 w-3.5 fill-current" />
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
