"use client";

import { useState, useMemo } from "react";
import { PageHeader, TableShell, Th, Td, Badge, Empty, Stat, Modal, Pagination } from "@/components/admin";
import { rupiah } from "@/lib/utils";
import { Users, Search, ShoppingBag, Phone, History, Sparkles, UserCheck } from "lucide-react";

type BookingRecord = {
  id: string;
  jadwal: string;
  status: string;
  diskon: number;
  catatan?: string | null;
  produk: { nama: string; harga: number };
  karyawan?: { nama: string } | null;
};

type PelangganWithHistory = {
  id: string;
  nama: string;
  wa: string;
  alamat?: string | null;
  poin?: number;
  createdAt: string;
  bookings: BookingRecord[];
};

export default function PelangganClient({ data }: { data: PelangganWithHistory[] }) {
  const [q, setQ] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<PelangganWithHistory | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const filtered = useMemo(() => {
    return data.filter(
      (p) =>
        p.nama.toLowerCase().includes(q.toLowerCase()) ||
        p.wa.includes(q) ||
        (p.alamat && p.alamat.toLowerCase().includes(q.toLowerCase()))
    );
  }, [data, q]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = useMemo(() => {
    return filtered.slice((page - 1) * pageSize, page * pageSize);
  }, [filtered, page, pageSize]);


  // General CRM Stats
  const totalPelanggan = data.length;
  const pelangganSetia = data.filter((p) => p.bookings.length >= 3).length;
  const totalSpending = data.reduce((acc, p) => {
    const custSpend = p.bookings
      .filter((b) => b.status === "SELESAI")
      .reduce((sum, b) => sum + Math.max(0, b.produk.harga - (b.diskon ?? 0)), 0);
    return acc + custSpend;
  }, 0);

  // Stats for Selected Customer in Modal
  const customerDetailStats = useMemo(() => {
    if (!selectedCustomer) return null;
    const completedBookings = selectedCustomer.bookings.filter((b) => b.status === "SELESAI");
    const lifetimeSpend = completedBookings.reduce(
      (sum, b) => sum + Math.max(0, b.produk.harga - (b.diskon ?? 0)),
      0
    );

    // Find favorite treatment
    const treatmentCounts = new Map<string, number>();
    completedBookings.forEach((b) => {
      const name = b.produk.nama;
      treatmentCounts.set(name, (treatmentCounts.get(name) || 0) + 1);
    });
    let favTreatment = "—";
    let maxTCount = 0;
    treatmentCounts.forEach((count, name) => {
      if (count > maxTCount) {
        maxTCount = count;
        favTreatment = name;
      }
    });

    // Find favorite therapist
    const therapistCounts = new Map<string, number>();
    completedBookings.forEach((b) => {
      if (b.karyawan?.nama) {
        const name = b.karyawan.nama;
        therapistCounts.set(name, (therapistCounts.get(name) || 0) + 1);
      }
    });
    let favTherapist = "—";
    let maxKCount = 0;
    therapistCounts.forEach((count, name) => {
      if (count > maxKCount) {
        maxKCount = count;
        favTherapist = name;
      }
    });

    return {
      completedCount: completedBookings.length,
      totalCount: selectedCustomer.bookings.length,
      lifetimeSpend,
      favTreatment: maxTCount > 0 ? `${favTreatment} (${maxTCount}x)` : "—",
      favTherapist: maxKCount > 0 ? `${favTherapist} (${maxKCount}x)` : "—",
    };
  }, [selectedCustomer]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="CRM & Riwayat Pelanggan"
        desc={`${totalPelanggan} pelanggan terdaftar. Lihat riwayat treatment, poin loyalitas, & total pengeluaran per pelanggan.`}
      />

      {/* CRM Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat icon={<Users size={20} />} label="Total Pelanggan" value={`${totalPelanggan} Orang`} tone="sage" />
        <Stat icon={<UserCheck size={20} />} label="Pelanggan Setia (≥3x Booking)" value={`${pelangganSetia} Orang`} tone="gold" />
        <Stat icon={<ShoppingBag size={20} />} label="Total Omzet dari Pelanggan" value={rupiah(totalSpending)} tone="green" />
      </div>

      {/* Search Bar */}
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-stone-200/70 bg-white p-4 shadow-sm">
        <div className="relative w-full max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari nama pelanggan / nomor WA..."
            className="w-full rounded-xl border border-stone-200 bg-stone-50/60 py-2 pl-10 pr-4 text-xs font-medium text-stone-900 outline-none focus:border-sage-600 focus:bg-white"
          />
        </div>
        <span className="text-xs text-stone-400">{filtered.length} pelanggan ditemukan</span>
      </div>

      {/* Customers Table */}
      {filtered.length === 0 ? (
        <Empty text="Tidak ada pelanggan yang cocok dengan pencarian." />
      ) : (
        <>
          <TableShell>
            <thead>
              <tr>
                <Th>Pelanggan</Th>
                <Th>WhatsApp</Th>
                <Th>Poin Loyalitas</Th>
                <Th>Total Booking</Th>
                <Th className="text-right">Total Belanja (Spend)</Th>
                <Th className="text-right">Aksi</Th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((p) => {
                const completed = p.bookings.filter((b) => b.status === "SELESAI");
                const spend = completed.reduce(
                  (sum, b) => sum + Math.max(0, b.produk.harga - (b.diskon ?? 0)),
                  0
                );
                return (
                  <tr key={p.id} className="transition hover:bg-stone-50">
                    <Td>
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sage-700 text-sm font-bold text-white shadow-sm">
                          {p.nama.slice(0, 1).toUpperCase()}
                        </span>
                        <div>
                          <p className="font-semibold text-stone-900">{p.nama}</p>
                          <p className="text-[11px] text-stone-400">
                            Terdaftar {new Date(p.createdAt).toLocaleDateString("id-ID", { timeZone: "Asia/Jakarta" })}
                          </p>
                        </div>
                      </div>
                    </Td>
                    <Td className="font-mono text-stone-600">{p.wa}</Td>
                    <Td>
                      <Badge tone="gold">⭐ {p.poin ?? 0} Poin</Badge>
                    </Td>
                    <Td>
                      <Badge tone={completed.length >= 3 ? "gold" : "sage"}>
                        {p.bookings.length}x ({completed.length} selesai)
                      </Badge>
                    </Td>
                    <Td className="text-right font-bold text-sage-900">{rupiah(spend)}</Td>
                    <Td className="text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedCustomer(p)}
                        className="rounded-xl border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 hover:border-sage-600 hover:text-sage-700"
                      >
                        <History size={13} className="mr-1 inline-block" /> Riwayat Treatment
                      </button>
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

      {/* Customer Detail Modal (CRM History View) */}
      <Modal
        open={!!selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
        title={`Riwayat Treatment: ${selectedCustomer?.nama ?? ""}`}
        desc="Detail informasi profil, histori layanan, terapis langganan, dan akumulasi pengeluaran."
        wide
      >
        {selectedCustomer && customerDetailStats && (
          <div className="space-y-5 text-stone-800">
            {/* Customer Summary Cards */}
            <div className="grid gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-stone-200 bg-stone-50 p-3">
                <span className="text-[10px] font-bold uppercase text-stone-400">Total Pengeluaran</span>
                <p className="text-base font-extrabold text-sage-900">{rupiah(customerDetailStats.lifetimeSpend)}</p>
              </div>
              <div className="rounded-xl border border-gold-200 bg-gold-50 p-3">
                <span className="text-[10px] font-bold uppercase text-gold-700">Poin Loyalitas</span>
                <p className="text-base font-extrabold text-gold-950">⭐ {selectedCustomer.poin ?? 0} Poin</p>
              </div>
              <div className="rounded-xl border border-stone-200 bg-stone-50 p-3">
                <span className="text-[10px] font-bold uppercase text-stone-400">Perawatan Favorit</span>
                <p className="text-xs font-bold text-stone-800 truncate">{customerDetailStats.favTreatment}</p>
              </div>
              <div className="rounded-xl border border-stone-200 bg-stone-50 p-3">
                <span className="text-[10px] font-bold uppercase text-stone-400">Terapis Langganan</span>
                <p className="text-xs font-bold text-stone-800 truncate">{customerDetailStats.favTherapist}</p>
              </div>
            </div>

            {/* Customer Contact Info */}
            <div className="flex flex-wrap items-center gap-4 text-xs bg-sage-50/70 border border-sage-200/70 p-3 rounded-xl">
              <div className="flex items-center gap-1 text-sage-900 font-semibold">
                <Phone size={14} /> WA: {selectedCustomer.wa}
              </div>
              <a
                href={`https://wa.me/${selectedCustomer.wa.replace(/[^0-9]/g, "")}`}
                target="_blank"
                rel="noreferrer"
                className="ml-auto rounded-lg bg-emerald-600 px-3 py-1 text-[11px] font-bold text-white shadow-sm hover:bg-emerald-700"
              >
                Chat WhatsApp
              </a>
            </div>

            {/* Treatment History Table */}
            <div>
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-stone-500">
                Histori Transaksi &amp; Perawatan ({selectedCustomer.bookings.length})
              </h3>

              {selectedCustomer.bookings.length === 0 ? (
                <p className="py-4 text-center text-xs text-stone-400">Belum ada riwayat booking.</p>
              ) : (
                <div className="max-h-64 overflow-y-auto rounded-xl border border-stone-200">
                  <TableShell>
                    <thead>
                      <tr>
                        <Th>Tanggal</Th>
                        <Th>Perawatan</Th>
                        <Th>Terapis</Th>
                        <Th>Status</Th>
                        <Th className="text-right">Harga Bersih</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedCustomer.bookings.map((b) => {
                        const hargaBersih = Math.max(0, b.produk.harga - (b.diskon ?? 0));
                        return (
                          <tr key={b.id} className="transition hover:bg-stone-50">
                            <Td className="whitespace-nowrap text-xs text-stone-500">
                              {new Date(b.jadwal).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })}
                            </Td>
                            <Td className="font-semibold text-stone-900">{b.produk.nama}</Td>
                            <Td className="text-xs text-stone-600">{b.karyawan?.nama || "—"}</Td>
                            <Td>
                              <Badge
                                tone={
                                  b.status === "SELESAI"
                                    ? "green"
                                    : b.status === "BATAL"
                                    ? "red"
                                    : "gold"
                                }
                              >
                                {b.status}
                              </Badge>
                            </Td>
                            <Td className="text-right font-bold text-stone-900">{rupiah(hargaBersih)}</Td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </TableShell>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="rounded-full border border-stone-300 px-5 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-100"
              >
                Tutup
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
