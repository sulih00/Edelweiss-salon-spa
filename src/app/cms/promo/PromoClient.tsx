"use client";
import { useEffect, useState, useCallback } from "react";
import { Input, Label, Btn, useAlert } from "@/components/ui";
import { Modal, PageHeader, AddButton, TableShell, Th, Td, RowBtn, Empty, Switch, FilterTabs } from "@/components/admin";
import { labelPromo } from "@/lib/promo";
import { Pencil, Trash2 } from "lucide-react";

type P = {
  id: string;
  kode: string;
  nama: string;
  deskripsi?: string | null;
  tipe: string;
  nilai: number;
  minBelanja: number;
  maxDiskon?: number | null;
  kuota?: number | null;
  terpakai: number;
  mulai: string;
  berakhir?: string | null;
  aktif: boolean;
};

const emptyForm = {
  kode: "",
  nama: "",
  deskripsi: "",
  tipe: "PERSEN",
  nilai: "10",
  minBelanja: "0",
  maxDiskon: "",
  kuota: "",
  mulai: "",
  berakhir: "",
};

export default function PromoClient() {
  const { alert, confirm, toast } = useAlert();
  const [data, setData] = useState<P[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [err, setErr] = useState("");
  const [modal, setModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<"semua" | "tampil" | "sembunyi">("semua");

  const [sortCol, setSortCol] = useState<string>("kode");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const handleSort = (col: string) => {
    if (sortCol === col) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("asc"); }
  };

  const tampilCount = data.filter((d) => d.aktif).length;
  const shown = data
    .filter((d) => filter === "semua" || (filter === "tampil" ? d.aktif : !d.aktif))
    .sort((a, b) => {
      let valA: string | number = (a[sortCol as keyof P] ?? "") as string | number;
      let valB: string | number = (b[sortCol as keyof P] ?? "") as string | number;

      if (sortCol === "berakhir") {
        valA = a.berakhir ? new Date(a.berakhir).getTime() : 0;
        valB = b.berakhir ? new Date(b.berakhir).getTime() : 0;
      }

      if (typeof valA === "string") {
        const cmp = String(valA).localeCompare(String(valB));
        return sortDir === "asc" ? cmp : -cmp;
      }
      const cmp = Number(valA) - Number(valB);
      return sortDir === "asc" ? cmp : -cmp;
    });

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/cms/promo");
      if (r.ok) setData(await r.json());
    } catch (e) {
      console.error("Gagal memuat promo:", e);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    fetch("/api/cms/promo")
      .then((r) => (r.ok ? r.json() : []))
      .then((j) => {
        if (!ignore && Array.isArray(j)) setData(j);
      })
      .catch((e) => console.error(e));

    return () => {
      ignore = true;
    };
  }, []);

  function openCreateModal() {
    setEditingId(null);
    setForm(emptyForm);
    setErr("");
    setModal(true);
  }

  function openEditModal(p: P) {
    setEditingId(p.id);
    setForm({
      kode: p.kode,
      nama: p.nama,
      deskripsi: p.deskripsi || "",
      tipe: p.tipe || "PERSEN",
      nilai: String(p.nilai),
      minBelanja: String(p.minBelanja || 0),
      maxDiskon: p.maxDiskon ? String(p.maxDiskon) : "",
      kuota: p.kuota ? String(p.kuota) : "",
      mulai: p.mulai ? new Date(p.mulai).toISOString().split("T")[0] : "",
      berakhir: p.berakhir ? new Date(p.berakhir).toISOString().split("T")[0] : "",
    });
    setErr("");
    setModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setSaving(true);

    const payload = {
      id: editingId ?? undefined,
      ...form,
      nilai: Number(form.nilai),
      minBelanja: Number(form.minBelanja || 0),
      maxDiskon: form.maxDiskon ? Number(form.maxDiskon) : null,
      kuota: form.kuota ? Number(form.kuota) : null,
    };

    try {
      const r = await fetch("/api/cms/promo", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const j = await r.json();
      setSaving(false);

      if (!r.ok) {
        setErr(j.error ?? "Gagal menyimpan promo");
        return;
      }

      toast.success(editingId ? "Promo berhasil diperbarui! ✨" : "Promo baru berhasil dibuat! ✨");
      setModal(false);
      setEditingId(null);
      setForm(emptyForm);
      load();
    } catch (e: unknown) {
      setSaving(false);
      const msg = e instanceof Error ? e.message : "Terjadi kesalahan";
      setErr(msg);
    }
  }

  async function toggle(p: P) {
    try {
      await fetch("/api/cms/promo", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: p.id, aktif: !p.aktif }),
      });
      toast.info(`Status promo "${p.kode}" diubah.`);
      load();
    } catch (e) {
      console.error("Gagal toggle status promo:", e);
    }
  }

  async function hapus(id: string) {
    const isOk = await confirm("Apakah Anda yakin ingin menghapus promo ini?", "Hapus Promo");
    if (!isOk) return;

    try {
      const r = await fetch(`/api/cms/promo?id=${id}`, { method: "DELETE" });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        await alert(j.error ?? "Gagal menghapus promo", "Gagal Hapus", "error");
      } else {
        toast.success("Promo berhasil dihapus.");
        load();
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Terjadi kesalahan";
      toast.error(msg);
    }
  }

  return (
    <div>
      <PageHeader
        title="Promo & Diskon"
        desc={`${tampilCount} dari ${data.length} tampil di website. Kode promo otomatis memotong kas saat booking SELESAI.`}
        action={<AddButton onClick={openCreateModal} label="Buat Promo" />}
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

      {shown.length === 0 ? (
        <Empty text={data.length === 0 ? "Belum ada promo." : "Tidak cocok dengan filter."} />
      ) : (
        <TableShell>
          <thead>
            <tr>
              <Th sortable sortDirection={sortCol === "kode" ? sortDir : null} onSort={() => handleSort("kode")}>Kode</Th>
              <Th sortable sortDirection={sortCol === "nama" ? sortDir : null} onSort={() => handleSort("nama")}>Nama</Th>
              <Th sortable sortDirection={sortCol === "nilai" ? sortDir : null} onSort={() => handleSort("nilai")}>Diskon</Th>
              <Th sortable sortDirection={sortCol === "terpakai" ? sortDir : null} onSort={() => handleSort("terpakai")}>Pemakaian</Th>
              <Th sortable sortDirection={sortCol === "berakhir" ? sortDir : null} onSort={() => handleSort("berakhir")}>Berlaku s/d</Th>
              <Th sortable sortDirection={sortCol === "aktif" ? sortDir : null} onSort={() => handleSort("aktif")}>Tampil di Website</Th>
              <Th className="text-right">Aksi</Th>
            </tr>
          </thead>
          <tbody>
            {shown.map((p) => (
              <tr key={p.id} className="transition hover:bg-stone-50">
                <Td>
                  <span className="rounded-md border border-dashed border-gold-500 bg-gold-400/10 px-2 py-0.5 font-mono text-xs font-bold">
                    {p.kode}
                  </span>
                </Td>
                <Td>
                  <p className="font-semibold text-stone-900">{p.nama}</p>
                  <p className="max-w-[240px] truncate text-xs text-stone-400">
                    {p.deskripsi}
                    {p.minBelanja > 0 && ` • min Rp ${p.minBelanja.toLocaleString("id-ID")}`}
                  </p>
                </Td>
                <Td className="font-semibold">{labelPromo(p)}</Td>
                <Td className="text-stone-500">{p.kuota ? `${p.terpakai}/${p.kuota}` : `${p.terpakai}x`}</Td>
                <Td className="text-stone-500">
                  {p.berakhir ? new Date(p.berakhir).toLocaleDateString("id-ID", { timeZone: "Asia/Jakarta" }) : "—"}
                </Td>
                <Td>
                  <div className="flex items-center gap-2">
                    <Switch on={p.aktif} onClick={() => toggle(p)} />
                    <span className="text-xs text-stone-500">{p.aktif ? "Tampil" : "Sembunyi"}</span>
                  </div>
                </Td>
                <Td className="text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <RowBtn onClick={() => openEditModal(p)} title="Edit Promo">
                      <Pencil size={14} />
                    </RowBtn>
                    <RowBtn tone="danger" onClick={() => hapus(p.id)} title="Hapus Promo">
                      <Trash2 size={14} />
                    </RowBtn>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      )}

      {/* Modal Tambah / Edit Promo */}
      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title={editingId ? "Edit Promo & Diskon" : "Buat Promo Baru"}
        desc={editingId ? "Ubah data promo yang dipilih di bawah ini." : "Kode unik dipakai pelanggan saat booking."}
        wide
      >
        <form onSubmit={handleSubmit} className="grid gap-3 md:grid-cols-2">
          <div>
            <Label>Kode (unik)</Label>
            <Input
              value={form.kode}
              onChange={(e) => setForm({ ...form, kode: e.target.value.toUpperCase() })}
              placeholder="GLOWING10"
              required
            />
          </div>
          <div>
            <Label>Tipe</Label>
            <select
              className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm outline-none focus:border-sage-600"
              value={form.tipe}
              onChange={(e) => setForm({ ...form, tipe: e.target.value })}
            >
              <option value="PERSEN">Persen (%)</option>
              <option value="NOMINAL">Nominal (Rp)</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <Label>Nama promo</Label>
            <Input
              value={form.nama}
              onChange={(e) => setForm({ ...form, nama: e.target.value })}
              placeholder="Diskon 10% Semua Treatment"
              required
            />
          </div>
          <div>
            <Label>Nilai {form.tipe === "PERSEN" ? "(%)" : "(Rp)"}</Label>
            <Input
              type="number"
              value={form.nilai}
              onChange={(e) => setForm({ ...form, nilai: e.target.value })}
            />
          </div>
          <div>
            <Label>Min belanja (Rp)</Label>
            <Input
              type="number"
              value={form.minBelanja}
              onChange={(e) => setForm({ ...form, minBelanja: e.target.value })}
            />
          </div>
          <div>
            <Label>Maks diskon (Rp, opsional)</Label>
            <Input
              type="number"
              value={form.maxDiskon}
              onChange={(e) => setForm({ ...form, maxDiskon: e.target.value })}
              placeholder="cth 50000"
            />
          </div>
          <div>
            <Label>Kuota (opsional)</Label>
            <Input
              type="number"
              value={form.kuota}
              onChange={(e) => setForm({ ...form, kuota: e.target.value })}
              placeholder="cth 50"
            />
          </div>
          <div>
            <Label>Mulai</Label>
            <Input
              type="date"
              value={form.mulai}
              onChange={(e) => setForm({ ...form, mulai: e.target.value })}
            />
          </div>
          <div>
            <Label>Berakhir (opsional)</Label>
            <Input
              type="date"
              value={form.berakhir}
              onChange={(e) => setForm({ ...form, berakhir: e.target.value })}
            />
          </div>
          <div className="md:col-span-2">
            <Label>Deskripsi</Label>
            <Input
              value={form.deskripsi}
              onChange={(e) => setForm({ ...form, deskripsi: e.target.value })}
            />
          </div>

          {err && <p className="text-sm font-semibold text-rose-600 md:col-span-2">{err}</p>}

          <div className="flex justify-end gap-2 md:col-span-2 pt-2">
            <button
              type="button"
              onClick={() => setModal(false)}
              className="rounded-full border border-stone-300 px-5 py-2.5 text-sm font-medium hover:bg-stone-50 cursor-pointer"
            >
              Batal
            </button>
            <Btn disabled={saving}>{saving ? "Menyimpan..." : editingId ? "Simpan Perubahan" : "Simpan Promo"}</Btn>
          </div>
        </form>
      </Modal>
    </div>
  );
}
