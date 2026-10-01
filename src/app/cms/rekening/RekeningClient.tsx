"use client";
import { useEffect, useState, useCallback } from "react";
import { Input, Label, Btn, useAlert } from "@/components/ui";
import { Modal, PageHeader, AddButton, TableShell, Th, Td, RowBtn, Empty, Switch } from "@/components/admin";

type R = { id: string; bank: string; nomor: string; atasNama: string; aktif: boolean; urutan: number };

const empty = { bank: "", nomor: "", atasNama: "Edelweiss Salon Spa", urutan: "" };

export default function RekeningClient() {
  const { confirm, toast } = useAlert();
  const [data, setData] = useState<R[]>([]);
  const [form, setForm] = useState(empty);
  const [err, setErr] = useState("");
  const [modal, setModal] = useState(false);

  const load = useCallback(async () => {
    const r = await fetch("/api/cms/rekening");
    if (r.ok) setData(await r.json());
  }, []);

  useEffect(() => {
    let mounted = true;
    fetch("/api/cms/rekening")
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
    const r = await fetch("/api/cms/rekening", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const j = await r.json();
    if (!r.ok) setErr(j.error ?? "Gagal");
    else { setForm(empty); setModal(false); load(); }
  }

  async function toggle(r: R) {
    await fetch("/api/cms/rekening", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: r.id, aktif: !r.aktif }) });
    load();
  }

  async function hapus(id: string) {
    const isOk = await confirm("Hapus rekening ini?", "Hapus Rekening");
    if (!isOk) return;
    await fetch(`/api/cms/rekening?id=${id}`, { method: "DELETE" });
    toast.success("Rekening berhasil dihapus.");
    load();
  }

  return (
    <div>
      <PageHeader
        title="Rekening Pembayaran"
        desc="Nomor yang aktif tampil otomatis di halaman booking. Matikan (bukan hapus) jika sementara tidak dipakai."
        action={<AddButton onClick={() => { setForm(empty); setErr(""); setModal(true); }} label="Tambah Rekening" />}
      />

      {data.length === 0 ? <Empty text="Belum ada rekening." /> : (
        <TableShell>
          <thead>
            <tr><Th>Urutan</Th><Th>Bank</Th><Th>Nomor</Th><Th>Atas Nama</Th><Th>Tampil di Website</Th><Th className="text-right">Aksi</Th></tr>
          </thead>
          <tbody>
            {data.map((r) => (
              <tr key={r.id} className="transition hover:bg-stone-50">
                <Td className="text-stone-400">{r.urutan}</Td>
                <Td><span className="font-bold text-stone-900">{r.bank}</span></Td>
                <Td className="font-mono tracking-wider">{r.nomor}</Td>
                <Td className="text-stone-500">{r.atasNama}</Td>
                <Td>
                  <div className="flex items-center gap-2">
                    <Switch on={r.aktif} onClick={() => toggle(r)} />
                    <span className="text-xs text-stone-500">{r.aktif ? "Tampil" : "Sembunyi"}</span>
                  </div>
                </Td>
                <Td className="text-right">
                  <RowBtn tone="danger" onClick={() => hapus(r.id)}>Hapus</RowBtn>
                </Td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="Tambah Rekening" desc="Rekening aktif langsung tampil di halaman booking.">
        <form onSubmit={create} className="grid gap-3">
          <div><Label>Bank / E-wallet</Label><Input value={form.bank} onChange={(e) => setForm({ ...form, bank: e.target.value })} placeholder="cth BCA / Mandiri / DANA" required /></div>
          <div><Label>Nomor</Label><Input value={form.nomor} onChange={(e) => setForm({ ...form, nomor: e.target.value })} placeholder="cth 1234566285728818103" required /></div>
          <div><Label>Atas nama</Label><Input value={form.atasNama} onChange={(e) => setForm({ ...form, atasNama: e.target.value })} required /></div>
          <div><Label>Urutan tampil (opsional)</Label><Input type="number" value={form.urutan} onChange={(e) => setForm({ ...form, urutan: e.target.value })} placeholder="otomatis di akhir" /></div>
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
