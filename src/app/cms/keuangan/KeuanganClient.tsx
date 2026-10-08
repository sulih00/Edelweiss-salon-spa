"use client";
import { useEffect, useMemo, useState, useCallback } from "react";
import * as XLSX from "xlsx";
import { Input, Label, Btn } from "@/components/ui";
import { Modal, PageHeader, AddButton, Stat, TableShell, Th, Td, Badge, Pagination } from "@/components/admin";
import { rupiah } from "@/lib/utils";
import { Wallet, TrendingDown, Scale, Search, X } from "lucide-react";

type T = { id: string; tanggal: string; tipe: string; kategori: string; jumlah: number; keterangan?: string | null; bookingId?: string | null };

export default function KeuanganClient() {
  const [data, setData] = useState<T[]>([]);
  const [form, setForm] = useState({ tipe: "MASUK", kategori: "Jasa Salon", jumlah: "100000", keterangan: "" });
  const [dari, setDari] = useState("");
  const [sampai, setSampai] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [tipeFilter, setTipeFilter] = useState<"SEMUA" | "MASUK" | "KELUAR">("SEMUA");
  const [modal, setModal] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const load = useCallback(async () => {
    const r = await fetch("/api/cms/keuangan");
    if (r.ok) {
      const j = await r.json();
      if (Array.isArray(j)) setData(j);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    fetch("/api/cms/keuangan")
      .then((r) => r.ok ? r.json() : [])
      .then((j) => {
        if (mounted && Array.isArray(j)) setData(j);
      });
    return () => {
      mounted = false;
    };
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/cms/keuangan", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, jumlah: Number(form.jumlah) }) });
    setForm({ tipe: "MASUK", kategori: "Jasa Salon", jumlah: "100000", keterangan: "" });
    setModal(false);
    load();
  }

  const [sortCol, setSortCol] = useState<string>("tanggal");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const handleSort = (col: string) => {
    if (sortCol === col) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("asc"); }
  };

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const result = data.filter((d) => {
      const t = new Date(d.tanggal).getTime();
      if (dari && t < new Date(dari).getTime()) return false;
      if (sampai && t > new Date(sampai + "T23:59:59").getTime()) return false;
      if (tipeFilter !== "SEMUA" && d.tipe !== tipeFilter) return false;
      if (q) {
        const matchKat = d.kategori.toLowerCase().includes(q);
        const matchKet = (d.keterangan ?? "").toLowerCase().includes(q);
        const matchJml = String(d.jumlah).includes(q);
        if (!matchKat && !matchKet && !matchJml) return false;
      }
      return true;
    });

    return result.sort((a, b) => {
      let valA: string | number = (a[sortCol as keyof T] ?? "") as string | number;
      let valB: string | number = (b[sortCol as keyof T] ?? "") as string | number;

      if (sortCol === "tanggal") {
        valA = new Date(a.tanggal).getTime();
        valB = new Date(b.tanggal).getTime();
      }

      if (typeof valA === "string") {
        const cmp = String(valA).localeCompare(String(valB));
        return sortDir === "asc" ? cmp : -cmp;
      }
      const cmp = Number(valA) - Number(valB);
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [data, dari, sampai, tipeFilter, searchQuery, sortCol, sortDir]);

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = useMemo(() => {
    return filtered.slice((page - 1) * pageSize, page * pageSize);
  }, [filtered, page, pageSize]);

  const masuk = filtered.filter((d) => d.tipe === "MASUK").reduce((a, b) => a + b.jumlah, 0);
  const keluar = filtered.filter((d) => d.tipe === "KELUAR").reduce((a, b) => a + b.jumlah, 0);

  function exportExcel() {
    const rows = filtered.map((d) => ({
      Tanggal: new Date(d.tanggal).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" }),
      Tipe: d.tipe,
      Kategori: d.kategori,
      Jumlah: d.jumlah,
      Keterangan: d.keterangan ?? "",
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Keuangan");
    XLSX.writeFile(wb, `keuangan-edelweiss-${Date.now()}.xlsx`);
  }

  function exportCSV() {
    const head = "tanggal,tipe,kategori,jumlah,keterangan\n";
    const body = filtered.map((d) => `"${new Date(d.tanggal).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })}",${d.tipe},"${d.kategori}",${d.jumlah},"${(d.keterangan ?? "").replace(/"/g, "'")}"`).join("\n");
    const blob = new Blob([head + body], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "keuangan-edelweiss.csv";
    a.click();
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Buku Keuangan &amp; Arus Kas"
        desc="Rekapitulasi pencatatan kas masuk &amp; pengeluaran salon."
        action={
          <div className="flex flex-wrap gap-2">
            <button onClick={exportExcel} className="rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-600 hover:bg-stone-50 transition cursor-pointer">Excel</button>
            <button onClick={exportCSV} className="rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-600 hover:bg-stone-50 transition cursor-pointer">CSV</button>
            <button onClick={() => window.print()} className="rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-600 print:hidden hover:bg-stone-50 transition cursor-pointer">Cetak</button>
            <AddButton onClick={() => setModal(true)} label="Tambah Transaksi" />
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat icon={<Wallet size={20} />} label="Kas Masuk (filter)" value={rupiah(masuk)} tone="green" />
        <Stat icon={<TrendingDown size={20} />} label="Pengeluaran (filter)" value={rupiah(keluar)} tone="red" />
        <Stat icon={<Scale size={20} />} label="Saldo Bersih (filter)" value={rupiah(masuk - keluar)} tone="sage" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-stone-200/80 bg-white p-4 shadow-xs print:hidden">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px]">
            <Search size={15} className="absolute left-3.5 top-3 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Cari kategori / keterangan..."
              className="w-full rounded-xl border border-stone-200 bg-stone-50/60 pl-9 pr-8 py-2 text-xs font-medium text-stone-900 focus:border-sage-600 focus:bg-white focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-2.5 text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Type Filter Buttons */}
          <div className="flex items-center rounded-xl bg-stone-100 p-1 border border-stone-200 text-xs">
            {(["SEMUA", "MASUK", "KELUAR"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setTipeFilter(t);
                  setPage(1);
                }}
                className={`rounded-lg px-3 py-1 font-bold transition cursor-pointer ${
                  tipeFilter === t ? "bg-white text-sage-900 shadow-xs" : "text-stone-500 hover:text-stone-800"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Date Range Inputs */}
          <div className="flex items-center gap-2">
            <div><Label className="text-[10px]">Dari</Label><Input type="date" value={dari} onChange={(e) => { setDari(e.target.value); setPage(1); }} className="text-xs py-1.5" /></div>
            <div><Label className="text-[10px]">Sampai</Label><Input type="date" value={sampai} onChange={(e) => { setSampai(e.target.value); setPage(1); }} className="text-xs py-1.5" /></div>
            {(dari || sampai) && (
              <button onClick={() => { setDari(""); setSampai(""); setPage(1); }} className="mt-4 text-xs font-bold text-rose-600 hover:underline cursor-pointer">
                Reset
              </button>
            )}
          </div>
        </div>

        <p className="text-xs font-bold text-stone-500">{filtered.length} Transaksi</p>
      </div>

      <div>
        <TableShell>
          <thead>
            <tr>
              <Th sortable sortDirection={sortCol === "tanggal" ? sortDir : null} onSort={() => handleSort("tanggal")}>Tanggal</Th>
              <Th sortable sortDirection={sortCol === "kategori" ? sortDir : null} onSort={() => handleSort("kategori")}>Kategori</Th>
              <Th sortable sortDirection={sortCol === "keterangan" ? sortDir : null} onSort={() => handleSort("keterangan")}>Keterangan</Th>
              <Th sortable sortDirection={sortCol === "tipe" ? sortDir : null} onSort={() => handleSort("tipe")}>Tipe</Th>
              <Th sortable sortDirection={sortCol === "jumlah" ? sortDir : null} onSort={() => handleSort("jumlah")} className="text-right">Jumlah</Th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((d) => (
              <tr key={d.id} className="transition hover:bg-stone-50">
                <Td className="whitespace-nowrap text-stone-500 text-xs">{new Date(d.tanggal).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })}</Td>
                <Td className="font-bold text-stone-900 text-xs">{d.kategori}</Td>
                <Td className="max-w-[260px] truncate text-stone-500 text-xs">{d.keterangan || "—"}</Td>
                <Td><Badge tone={d.tipe === "MASUK" ? "green" : "red"}>{d.tipe}</Badge></Td>
                <Td className={`text-right font-extrabold text-xs ${d.tipe === "MASUK" ? "text-green-700" : "text-red-600"}`}>
                  {d.tipe === "MASUK" ? "+" : "−"}{rupiah(d.jumlah)}
                  {d.bookingId && (
                    <a href={`/cms/struk/${d.bookingId}`} className="ml-2 rounded-md border border-stone-200 px-1.5 py-0.5 text-[10px] font-semibold text-stone-500 hover:border-sage-600 hover:text-sage-700">
                      Struk
                    </a>
                  )}
                </Td>
              </tr>
            ))}
          </tbody>
        </TableShell>
        {filtered.length === 0 && <p className="rounded-b-2xl border border-t-0 border-stone-200/70 bg-white px-4 py-8 text-center text-xs text-stone-400 font-medium">Tidak ada data transaksi yang cocok dengan pencarian / filter.</p>}
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
          totalItems={filtered.length}
          pageSize={pageSize}
        />
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="Tambah Transaksi Manual" desc="Catat kas masuk atau pengeluaran operasional.">
        <form onSubmit={submit} className="grid gap-3 text-xs">
          <div><Label>Tipe Transaksi</Label>
            <select className="w-full rounded-xl border border-stone-300 px-3 py-2 text-xs font-bold text-stone-800 outline-none" value={form.tipe} onChange={(e) => setForm({ ...form, tipe: e.target.value })}>
              <option value="MASUK">MASUK (Pemasukan)</option>
              <option value="KELUAR">KELUAR (Pengeluaran)</option>
            </select>
          </div>
          <div><Label>Kategori</Label><Input value={form.kategori} onChange={(e) => setForm({ ...form, kategori: e.target.value })} placeholder="Jasa Salon / Produk / Gaji / Sewa / Listrik" className="text-xs" required /></div>
          <div><Label>Jumlah (Rp)</Label><Input type="number" value={form.jumlah} onChange={(e) => setForm({ ...form, jumlah: e.target.value })} className="text-xs font-bold" required /></div>
          <div><Label>Keterangan (Opsional)</Label><Input value={form.keterangan} onChange={(e) => setForm({ ...form, keterangan: e.target.value })} placeholder="Catatan transaksi..." className="text-xs" /></div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModal(false)} className="rounded-full border border-stone-300 px-5 py-2 text-xs font-bold text-stone-700 cursor-pointer">Batal</button>
            <Btn className="text-xs">Simpan Transaksi</Btn>
          </div>
        </form>
      </Modal>
    </div>
  );
}
