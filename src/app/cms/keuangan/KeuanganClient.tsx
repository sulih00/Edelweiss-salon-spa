"use client";
import { useEffect, useMemo, useState, useCallback } from "react";
import * as XLSX from "xlsx";
import { Input, Label, Btn } from "@/components/ui";
import { Modal, PageHeader, AddButton, Stat, TableShell, Th, Td, Badge, Pagination } from "@/components/admin";
import { rupiah } from "@/lib/utils";
import { Wallet, TrendingDown, Scale } from "lucide-react";

type T = { id: string; tanggal: string; tipe: string; kategori: string; jumlah: number; keterangan?: string | null; bookingId?: string | null };

export default function KeuanganClient() {
  const [data, setData] = useState<T[]>([]);
  const [form, setForm] = useState({ tipe: "MASUK", kategori: "Jasa Salon", jumlah: "100000", keterangan: "" });
  const [dari, setDari] = useState("");
  const [sampai, setSampai] = useState("");
  const [modal, setModal] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const load = useCallback(async () => {
    const r = await fetch("/api/cms/keuangan");
    setData(await r.json());
  }, []);

  useEffect(() => {
    let mounted = true;
    fetch("/api/cms/keuangan")
      .then((r) => r.json())
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

  const filtered = useMemo(() => {
    return data.filter((d) => {
      const t = new Date(d.tanggal).getTime();
      if (dari && t < new Date(dari).getTime()) return false;
      if (sampai && t > new Date(sampai + "T23:59:59").getTime()) return false;
      return true;
    });
  }, [data, dari, sampai]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = useMemo(() => {
    return filtered.slice((page - 1) * pageSize, page * pageSize);
  }, [filtered, page, pageSize]);

  const masuk = filtered.filter((d) => d.tipe === "MASUK").reduce((a, b) => a + b.jumlah, 0);
  const keluar = filtered.filter((d) => d.tipe === "KELUAR").reduce((a, b) => a + b.jumlah, 0);


  function exportExcel() {
    const rows = filtered.map((d) => ({
      Tanggal: new Date(d.tanggal).toLocaleString("id-ID"),
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
    const body = filtered.map((d) => `"${new Date(d.tanggal).toLocaleString("id-ID")}",${d.tipe},"${d.kategori}",${d.jumlah},"${(d.keterangan ?? "").replace(/"/g, "'")}"`).join("\n");
    const blob = new Blob([head + body], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "keuangan-edelweiss.csv";
    a.click();
  }

  return (
    <div>
      <PageHeader
        title="Keuangan"
        desc="Arus kas masuk & keluar."
        action={
          <div className="flex flex-wrap gap-2">
            <button onClick={exportExcel} className="rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-600">Excel</button>
            <button onClick={exportCSV} className="rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-600">CSV</button>
            <button onClick={() => window.print()} className="rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-600 print:hidden">Cetak</button>
            <AddButton onClick={() => setModal(true)} label="Tambah Transaksi" />
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat icon={<Wallet size={20} />} label="Masuk (filter)" value={rupiah(masuk)} tone="green" />
        <Stat icon={<TrendingDown size={20} />} label="Keluar (filter)" value={rupiah(keluar)} tone="red" />
        <Stat icon={<Scale size={20} />} label="Saldo (filter)" value={rupiah(masuk - keluar)} tone="sage" />
      </div>

      <div className="mt-4 flex flex-wrap items-end gap-3 rounded-2xl border border-stone-200/70 bg-white p-4 shadow-sm print:hidden">
        <div><Label>Dari</Label><Input type="date" value={dari} onChange={(e) => setDari(e.target.value)} /></div>
        <div><Label>Sampai</Label><Input type="date" value={sampai} onChange={(e) => setSampai(e.target.value)} /></div>
        <button onClick={() => { setDari(""); setSampai(""); }} className="pb-2.5 text-xs text-stone-400 underline">Reset</button>
        <p className="ml-auto pb-2 text-xs text-stone-400">{filtered.length} transaksi</p>
      </div>

      <div className="mt-4">
        <TableShell>
          <thead>
            <tr><Th>Tanggal</Th><Th>Kategori</Th><Th>Keterangan</Th><Th>Tipe</Th><Th className="text-right">Jumlah</Th></tr>
          </thead>
          <tbody>
            {paginated.map((d) => (
              <tr key={d.id} className="transition hover:bg-stone-50">
                <Td className="whitespace-nowrap text-stone-500">{new Date(d.tanggal).toLocaleString("id-ID")}</Td>
                <Td className="font-semibold">{d.kategori}</Td>
                <Td className="max-w-[260px] truncate text-stone-500">{d.keterangan || "—"}</Td>
                <Td><Badge tone={d.tipe === "MASUK" ? "green" : "red"}>{d.tipe}</Badge></Td>
                <Td className={`text-right font-bold ${d.tipe === "MASUK" ? "text-green-700" : "text-red-600"}`}>
                  {d.tipe === "MASUK" ? "+" : "−"}{rupiah(d.jumlah)}
                  {d.bookingId && (
                    <a href={`/cms/struk/${d.bookingId}`} className="ml-2 rounded-md border border-stone-200 px-1.5 py-0.5 text-[11px] font-semibold text-stone-500 hover:border-sage-600 hover:text-sage-700">
                      Struk
                    </a>
                  )}
                </Td>
              </tr>
            ))}
          </tbody>
        </TableShell>
        {filtered.length === 0 && <p className="rounded-b-2xl border border-t-0 border-stone-200/70 bg-white px-4 py-6 text-center text-sm text-stone-400">Tidak ada data pada rentang ini.</p>}
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
          totalItems={filtered.length}
          pageSize={pageSize}
        />
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="Tambah Transaksi" desc="Catat kas masuk / keluar manual.">
        <form onSubmit={submit} className="grid gap-3">
          <div><Label>Tipe</Label>
            <select className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm" value={form.tipe} onChange={(e) => setForm({ ...form, tipe: e.target.value })}>
              <option value="MASUK">MASUK</option>
              <option value="KELUAR">KELUAR</option>
            </select>
          </div>
          <div><Label>Kategori</Label><Input value={form.kategori} onChange={(e) => setForm({ ...form, kategori: e.target.value })} placeholder="Jasa / Produk / Gaji / Sewa" /></div>
          <div><Label>Jumlah (Rp)</Label><Input type="number" value={form.jumlah} onChange={(e) => setForm({ ...form, jumlah: e.target.value })} /></div>
          <div><Label>Keterangan</Label><Input value={form.keterangan} onChange={(e) => setForm({ ...form, keterangan: e.target.value })} /></div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setModal(false)} className="rounded-full border border-stone-300 px-5 py-2.5 text-sm">Batal</button>
            <Btn>Simpan</Btn>
          </div>
        </form>
      </Modal>
    </div>
  );
}
