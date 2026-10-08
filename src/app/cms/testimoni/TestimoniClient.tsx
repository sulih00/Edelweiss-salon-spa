"use client";
import { useEffect, useState, useCallback } from "react";
import { Input, Label, Btn, useAlert } from "@/components/ui";
import { Modal, PageHeader, AddButton, TableShell, Th, Td, RowBtn, Empty, Switch, FilterTabs } from "@/components/admin";
import { Star, Trash2 } from "lucide-react";

type T = { id: string; nama: string; isi: string; rating: number; tampil: boolean };

const empty = { nama: "", isi: "", rating: "5" };

export default function TestimoniClient() {
  const { confirm, toast } = useAlert();
  const [data, setData] = useState<T[]>([]);
  const [form, setForm] = useState(empty);
  const [err, setErr] = useState("");
  const [modal, setModal] = useState(false);
  const [filter, setFilter] = useState<"semua" | "tampil" | "sembunyi">("semua");

  const load = useCallback(async () => {
    const r = await fetch("/api/cms/testimoni");
    if (r.ok) setData(await r.json());
  }, []);

  useEffect(() => {
    let mounted = true;
    fetch("/api/cms/testimoni")
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
    const r = await fetch("/api/cms/testimoni", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, rating: Number(form.rating) }),
    });
    const j = await r.json();
    if (!r.ok) setErr(j.error ?? "Gagal");
    else { setForm(empty); setModal(false); load(); }
  }

  async function toggle(t: T) {
    await fetch("/api/cms/testimoni", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: t.id, tampil: !t.tampil }) });
    load();
  }

  async function hapus(id: string) {
    const isOk = await confirm("Hapus testimoni ini?", "Hapus Testimoni");
    if (!isOk) return;
    await fetch(`/api/cms/testimoni?id=${id}`, { method: "DELETE" });
    toast.success("Testimoni berhasil dihapus.");
    load();
  }

  const tampilCount = data.filter((d) => d.tampil).length;
  const shown = data.filter((d) => filter === "semua" || (filter === "tampil" ? d.tampil : !d.tampil));

  return (
    <div>
      <PageHeader
        title="Testimoni"
        desc={`${tampilCount} dari ${data.length} tampil di website.`}
        action={<AddButton onClick={() => { setForm(empty); setErr(""); setModal(true); }} label="Tambah Testimoni" />}
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

      {shown.length === 0 ? <Empty text={data.length === 0 ? "Belum ada testimoni." : "Tidak cocok dengan filter."} /> : (
        <TableShell>
          <thead>
            <tr><Th>Nama</Th><Th>Ulasan</Th><Th>Rating</Th><Th>Tampil di Website</Th><Th className="text-right">Aksi</Th></tr>
          </thead>
          <tbody>
            {shown.map((t) => (
              <tr key={t.id} className="transition hover:bg-stone-50">
                <Td><span className="font-semibold text-stone-900">{t.nama}</span></Td>
                <Td className="max-w-[320px]"><p className="line-clamp-2 text-stone-500">“{t.isi}”</p></Td>
                <Td>
                  <span className="flex gap-0.5 text-gold-500">
                    {Array.from({ length: t.rating }).map((_, i) => <Star key={i} size={13} fill="currentColor" />)}
                  </span>
                </Td>
                <Td>
                  <div className="flex items-center gap-2">
                    <Switch on={t.tampil} onClick={() => toggle(t)} />
                    <span className="text-xs text-stone-500">{t.tampil ? "Tampil" : "Sembunyi"}</span>
                  </div>
                </Td>
                <Td className="text-right">
                  <RowBtn tone="danger" onClick={() => hapus(t.id)} title="Hapus Testimoni">
                    <Trash2 size={14} />
                  </RowBtn>
                </Td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="Tambah Testimoni" desc="Ulasan aktif langsung tampil di website.">
        <form onSubmit={create} className="grid gap-3">
          <div><Label>Nama pelanggan</Label><Input value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} placeholder="cth Ratna" required /></div>
          <div>
            <Label>Isi ulasan</Label>
            <textarea
              value={form.isi}
              onChange={(e) => setForm({ ...form, isi: e.target.value })}
              required
              rows={3}
              placeholder="Ceritakan pengalaman treatment..."
              className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-sage-600 focus:ring-2 focus:ring-sage-100"
            />
          </div>
          <div><Label>Rating (1–5)</Label>
            <select className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm" value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })}>
              <option value="5">5 ★ — Sangat puas</option>
              <option value="4">4 ★ — Puas</option>
              <option value="3">3 ★ — Cukup</option>
              <option value="2">2 ★ — Kurang</option>
              <option value="1">1 ★ — Kecewa</option>
            </select>
          </div>
          {err && <p className="text-sm text-red-600">{err}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setModal(false)} className="rounded-full border border-stone-300 px-5 py-2.5 text-sm">Batal</button>
            <Btn>Simpan</Btn>
          </div>
        </form>
      </Modal>
    </div>
  );
}
