"use client";
import { useEffect, useState, useCallback } from "react";
import { Input, Label, Btn } from "@/components/ui";
import { Modal, PageHeader, AddButton, TableShell, Th, Td, RowBtn, Empty, Switch, FilterTabs } from "@/components/admin";
import { labelPromo } from "@/lib/promo";

type P = {
  id: string; kode: string; nama: string; deskripsi?: string | null;
  tipe: string; nilai: number; minBelanja: number; maxDiskon?: number | null;
  kuota?: number | null; terpakai: number; mulai: string; berakhir?: string | null; aktif: boolean;
};

const empty = { kode: "", nama: "", deskripsi: "", tipe: "PERSEN", nilai: "10", minBelanja: "0", maxDiskon: "", kuota: "", mulai: "", berakhir: "" };

export default function PromoClient() {
  const [data, setData] = useState<P[]>([]);
  const [form, setForm] = useState(empty);
  const [err, setErr] = useState("");
  const [modal, setModal] = useState(false);
  const [filter, setFilter] = useState<"semua" | "tampil" | "sembunyi">("semua");

  const tampilCount = data.filter((d) => d.aktif).length;
  const shown = data.filter((d) => filter === "semua" || (filter === "tampil" ? d.aktif : !d.aktif));

  const load = useCallback(async () => {
    const r = await fetch("/api/cms/promo");
    if (r.ok) setData(await r.json());
  }, []);

  useEffect(() => {
    let mounted = true;
    fetch("/api/cms/promo")
      .then((r) => (r.ok ? r.json() : []))
      .then((j) => {
        if (mounted && Array.isArray(j)) setData(j);
      });
    return () => {
      mounted = false;
    };
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    const r = await fetch("/api/cms/promo", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, nilai: Number(form.nilai), minBelanja: Number(form.minBelanja || 0) }),
    });
    const j = await r.json();
    if (!r.ok) setErr(j.error ?? "Gagal");
    else { setForm(empty); setModal(false); load(); }
  }

  async function toggle(p: P) {
    await fetch("/api/cms/promo", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: p.id, aktif: !p.aktif }) });
    load();
  }

  async function hapus(id: string) {
    if (!confirm("Hapus promo ini?")) return;
    await fetch(`/api/cms/promo?id=${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <PageHeader
        title="Promo & Diskon"
        desc={`${tampilCount} dari ${data.length} tampil di website. Kode promo otomatis memotong kas saat booking SELESAI.`}
        action={<AddButton onClick={() => setModal(true)} label="Buat Promo" />}
      />

      <div className="mb-4">
        <FilterTabs
          value={filter}
          onChange={setFilter}
          options={[
            { value: "semua", label: "Semua", count: data.length },
            { value: "tampil", label: "Tampil di Website", count: tampilCount },
            { value: "sembunyi", label: "Disembunyikan", count: data.length - tampilCount },
          ]}
        />
      </div>

      {shown.length === 0 ? <Empty text={data.length === 0 ? "Belum ada promo." : "Tidak cocok dengan filter."} /> : (
        <TableShell>
          <thead>
            <tr><Th>Kode</Th><Th>Nama</Th><Th>Diskon</Th><Th>Pemakaian</Th><Th>Berlaku s/d</Th><Th>Tampil di Website</Th><Th className="text-right">Aksi</Th></tr>
          </thead>
          <tbody>
            {shown.map((p) => (
              <tr key={p.id} className="transition hover:bg-stone-50">
                <Td><span className="rounded-md border border-dashed border-gold-500 bg-gold-400/10 px-2 py-0.5 font-mono text-xs font-bold">{p.kode}</span></Td>
                <Td>
                  <p className="font-semibold text-stone-900">{p.nama}</p>
                  <p className="max-w-[240px] truncate text-xs text-stone-400">{p.deskripsi}{p.minBelanja > 0 && ` • min Rp ${p.minBelanja.toLocaleString("id-ID")}`}</p>
                </Td>
                <Td className="font-semibold">{labelPromo(p)}</Td>
                <Td className="text-stone-500">{p.kuota ? `${p.terpakai}/${p.kuota}` : `${p.terpakai}x`}</Td>
                <Td className="text-stone-500">{p.berakhir ? new Date(p.berakhir).toLocaleDateString("id-ID", { timeZone: "Asia/Jakarta" }) : "—"}</Td>
                <Td>
                  <div className="flex items-center gap-2">
                    <Switch on={p.aktif} onClick={() => toggle(p)} />
                    <span className="text-xs text-stone-500">{p.aktif ? "Tampil" : "Sembunyi"}</span>
                  </div>
                </Td>
                <Td className="text-right">
                  <RowBtn tone="danger" onClick={() => hapus(p.id)}>Hapus</RowBtn>
                </Td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="Buat Promo Baru" desc="Kode unik dipakai pelanggan saat booking." wide>
        <form onSubmit={create} className="grid gap-3 md:grid-cols-2">
          <div><Label>Kode (unik)</Label><Input value={form.kode} onChange={(e) => setForm({ ...form, kode: e.target.value.toUpperCase() })} placeholder="GLOWING10" required /></div>
          <div><Label>Tipe</Label>
            <select className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm" value={form.tipe} onChange={(e) => setForm({ ...form, tipe: e.target.value })}>
              <option value="PERSEN">Persen (%)</option>
              <option value="NOMINAL">Nominal (Rp)</option>
            </select>
          </div>
          <div className="md:col-span-2"><Label>Nama promo</Label><Input value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} placeholder="Diskon 10% Semua Treatment" required /></div>
          <div><Label>Nilai {form.tipe === "PERSEN" ? "(%)" : "(Rp)"}</Label><Input type="number" value={form.nilai} onChange={(e) => setForm({ ...form, nilai: e.target.value })} /></div>
          <div><Label>Min belanja (Rp)</Label><Input type="number" value={form.minBelanja} onChange={(e) => setForm({ ...form, minBelanja: e.target.value })} /></div>
          <div><Label>Maks diskon (Rp, opsional)</Label><Input type="number" value={form.maxDiskon} onChange={(e) => setForm({ ...form, maxDiskon: e.target.value })} placeholder="cth 50000" /></div>
          <div><Label>Kuota (opsional)</Label><Input type="number" value={form.kuota} onChange={(e) => setForm({ ...form, kuota: e.target.value })} placeholder="cth 50" /></div>
          <div><Label>Mulai</Label><Input type="date" value={form.mulai} onChange={(e) => setForm({ ...form, mulai: e.target.value })} /></div>
          <div><Label>Berakhir (opsional)</Label><Input type="date" value={form.berakhir} onChange={(e) => setForm({ ...form, berakhir: e.target.value })} /></div>
          <div className="md:col-span-2"><Label>Deskripsi</Label><Input value={form.deskripsi} onChange={(e) => setForm({ ...form, deskripsi: e.target.value })} /></div>
          {err && <p className="text-sm text-red-600 md:col-span-2">{err}</p>}
          <div className="flex justify-end gap-2 md:col-span-2">
            <button type="button" onClick={() => setModal(false)} className="rounded-full border border-stone-300 px-5 py-2.5 text-sm">Batal</button>
            <Btn>Simpan Promo</Btn>
          </div>
        </form>
      </Modal>
    </div>
  );
}
