"use client";
import { useEffect, useState, useCallback } from "react";
import { Input, Label, Btn, useAlert } from "@/components/ui";
import { Modal, PageHeader, AddButton, TableShell, Th, Td, Badge, Empty, Stat } from "@/components/admin";
import { rupiah } from "@/lib/utils";
import { Award, DollarSign, CalendarCheck } from "lucide-react";

type K = { id: string; nama: string; jabatan: string; telepon?: string | null; komisiPersen: number };
type KomisiRow = {
  id: string;
  nama: string;
  jabatan: string;
  komisiPersen: number;
  totalTreatment: number;
  totalOmzet: number;
  totalKomisi: number;
};

const empty = { nama: "", jabatan: "Terapis", telepon: "", komisiPersen: "10" };

function getBulanIni() {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}`;
}

export default function KaryawanClient() {
  const { alert, toast } = useAlert();
  const [data, setData] = useState<K[]>([]);
  const [form, setForm] = useState(empty);
  const [modal, setModal] = useState(false);
  const [bulan, setBulan] = useState(getBulanIni());
  const [komisiData, setKomisiData] = useState<KomisiRow[]>([]);
  const [summary, setSummary] = useState({ totalTreatment: 0, grandTotalOmzet: 0, grandTotalKomisi: 0 });
  const [loadingKomisi, setLoadingKomisi] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const r = await fetch("/api/cms/karyawan");
      const j = await r.json();
      setData(j.karyawan ?? []);
    } catch (e) {
      console.error("Gagal memuat data karyawan:", e);
    }
  }, []);

  const loadKomisi = useCallback(async (b: string) => {
    setLoadingKomisi(true);
    try {
      const r = await fetch(`/api/cms/karyawan/komisi?bulan=${b}`);
      if (r.ok) {
        const j = await r.json();
        setKomisiData(j.rekap ?? []);
        setSummary(j.summary ?? { totalTreatment: 0, grandTotalOmzet: 0, grandTotalKomisi: 0 });
      }
    } catch (e) {
      console.error("Gagal memuat rekap komisi:", e);
    } finally {
      setLoadingKomisi(false);
    }
  }, []);

  useEffect(() => {
    Promise.resolve().then(() => {
      loadData();
      loadKomisi(bulan);
    });
  }, [loadData, loadKomisi, bulan]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const r = await fetch("/api/cms/karyawan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, komisiPersen: Number(form.komisiPersen) }),
    });
    if (!r.ok) {
      await alert("Gagal: Hanya OWNER/ADMIN yang diizinkan untuk menambah karyawan", "Akses Ditolak", "error");
      return;
    }
    toast.success("Karyawan baru berhasil ditambahkan!");
    setForm(empty);
    setModal(false);
    loadData();
    loadKomisi(bulan);
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Karyawan & Komisi Terapis"
        desc={`${data.length} karyawan terdaftar & rekap komisi per terapis.`}
        action={<AddButton onClick={() => setModal(true)} label="Tambah Karyawan" />}
      />

      {/* Section 1: Daftar Karyawan */}
      <div>
        <h2 className="mb-3 text-lg font-bold text-stone-900">Daftar Karyawan</h2>
        {data.length === 0 ? (
          <Empty text="Belum ada karyawan." />
        ) : (
          <TableShell>
            <thead>
              <tr>
                <Th>Nama</Th>
                <Th>Jabatan</Th>
                <Th>Telepon</Th>
                <Th className="text-right">Komisi (%)</Th>
              </tr>
            </thead>
            <tbody>
              {data.map((k) => (
                <tr key={k.id} className="transition hover:bg-stone-50">
                  <Td>
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sage-700 text-sm font-bold text-white">
                        {k.nama.slice(0, 1)}
                      </span>
                      <span className="font-semibold text-stone-900">{k.nama}</span>
                    </div>
                  </Td>
                  <Td>
                    <Badge>{k.jabatan}</Badge>
                  </Td>
                  <Td className="text-stone-500">{k.telepon || "—"}</Td>
                  <Td className="text-right font-semibold text-sage-800">{k.komisiPersen}%</Td>
                </tr>
              ))}
            </tbody>
          </TableShell>
        )}
      </div>

      {/* Section 2: Rekap Komisi Terapis */}
      <div className="rounded-2xl border border-stone-200/70 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-stone-900">Rekap Komisi Terapis</h2>
            <p className="text-xs text-stone-500">Hitung otomatis berdasarkan treatment SELESAI di bulan yang dipilih.</p>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-stone-500">Periode:</label>
            <input
              type="month"
              value={bulan}
              onChange={(e) => setBulan(e.target.value)}
              className="rounded-xl border border-stone-300 px-3 py-1.5 text-sm font-medium outline-none focus:border-sage-600"
            />
          </div>
        </div>

        <div className="mb-5 grid gap-4 sm:grid-cols-3">
          <Stat icon={<CalendarCheck size={20} />} label="Total Treatment Selesai" value={`${summary.totalTreatment} x`} tone="gold" />
          <Stat icon={<DollarSign size={20} />} label="Omzet Dihasilkan Terapis" value={rupiah(summary.grandTotalOmzet)} tone="green" />
          <Stat icon={<Award size={20} />} label="Total Komisi Hak Terapis" value={rupiah(summary.grandTotalKomisi)} tone="sage" />
        </div>

        {loadingKomisi ? (
          <p className="py-8 text-center text-sm text-stone-400">Memuat rekap komisi...</p>
        ) : komisiData.length === 0 ? (
          <p className="py-8 text-center text-sm text-stone-400">Belum ada data treatment selesai pada bulan ini.</p>
        ) : (
          <TableShell>
            <thead>
              <tr>
                <Th>Terapis</Th>
                <Th>Jabatan</Th>
                <Th className="text-right">Tarif Komisi</Th>
                <Th className="text-right">Treatment Selesai</Th>
                <Th className="text-right">Total Omzet</Th>
                <Th className="text-right">Nominal Komisi</Th>
              </tr>
            </thead>
            <tbody>
              {komisiData.map((row) => (
                <tr key={row.id} className="transition hover:bg-stone-50">
                  <Td className="font-semibold text-stone-900">{row.nama}</Td>
                  <Td>
                    <Badge tone="gold">{row.jabatan}</Badge>
                  </Td>
                  <Td className="text-right font-medium text-stone-600">{row.komisiPersen}%</Td>
                  <Td className="text-right font-semibold text-stone-800">{row.totalTreatment} x</Td>
                  <Td className="text-right font-medium text-stone-600">{rupiah(row.totalOmzet)}</Td>
                  <Td className="text-right font-bold text-sage-800">{rupiah(row.totalKomisi)}</Td>
                </tr>
              ))}
            </tbody>
          </TableShell>
        )}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="Tambah Karyawan" desc="Hanya OWNER/ADMIN yang bisa menambah.">
        <form onSubmit={submit} className="grid gap-3">
          <div>
            <Label>Nama</Label>
            <Input value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} required placeholder="Nama karyawan" />
          </div>
          <div>
            <Label>Jabatan</Label>
            <Input value={form.jabatan} onChange={(e) => setForm({ ...form, jabatan: e.target.value })} />
          </div>
          <div>
            <Label>Telepon</Label>
            <Input value={form.telepon} onChange={(e) => setForm({ ...form, telepon: e.target.value })} placeholder="08xx" />
          </div>
          <div>
            <Label>Komisi (%)</Label>
            <Input type="number" value={form.komisiPersen} onChange={(e) => setForm({ ...form, komisiPersen: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setModal(false)} className="rounded-full border border-stone-300 px-5 py-2.5 text-sm">
              Batal
            </button>
            <Btn>Simpan</Btn>
          </div>
        </form>
      </Modal>
    </div>
  );
}

