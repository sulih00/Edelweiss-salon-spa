"use client";
import { useEffect, useState, useCallback } from "react";
import { Input, Label, Btn, useAlert } from "@/components/ui";
import { Modal, PageHeader, AddButton, TableShell, Th, Td, RowBtn, Empty, Switch } from "@/components/admin";
import { Pencil, Trash2 } from "lucide-react";

type R = { id: string; bank: string; nomor: string; atasNama: string; aktif: boolean; urutan: number };

const emptyForm = { bank: "", nomor: "", atasNama: "Edelweiss Salon Makeup Art", urutan: "" };

export default function RekeningClient() {
  const { alert, confirm, toast } = useAlert();
  const [data, setData] = useState<R[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [err, setErr] = useState("");
  const [modal, setModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [sortCol, setSortCol] = useState<string>("urutan");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const handleSort = (col: string) => {
    if (sortCol === col) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("asc"); }
  };

  const sortedData = [...data].sort((a, b) => {
    const valA: string | number = (a[sortCol as keyof R] ?? "") as string | number;
    const valB: string | number = (b[sortCol as keyof R] ?? "") as string | number;

    if (typeof valA === "string") {
      const cmp = String(valA).localeCompare(String(valB));
      return sortDir === "asc" ? cmp : -cmp;
    }
    const cmp = Number(valA) - Number(valB);
    return sortDir === "asc" ? cmp : -cmp;
  });

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/cms/rekening");
      if (r.ok) setData(await r.json());
    } catch (e) {
      console.error("Gagal memuat rekening:", e);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    fetch("/api/cms/rekening")
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

  function openEditModal(r: R) {
    setEditingId(r.id);
    setForm({
      bank: r.bank,
      nomor: r.nomor,
      atasNama: r.atasNama,
      urutan: String(r.urutan || ""),
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
      urutan: form.urutan ? Number(form.urutan) : undefined,
    };

    try {
      const r = await fetch("/api/cms/rekening", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const j = await r.json();
      setSaving(false);

      if (!r.ok) {
        setErr(j.error ?? "Gagal menyimpan rekening");
        return;
      }

      toast.success(editingId ? "Rekening berhasil diperbarui!" : "Rekening baru berhasil ditambahkan!");
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

  async function toggle(r: R) {
    try {
      await fetch("/api/cms/rekening", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: r.id, aktif: !r.aktif }),
      });
      toast.info(`Status rekening "${r.bank}" diubah.`);
      load();
    } catch (e) {
      console.error("Gagal toggle rekening:", e);
    }
  }

  async function hapus(id: string) {
    const isOk = await confirm("Apakah Anda yakin ingin menghapus rekening ini?", "Hapus Rekening");
    if (!isOk) return;

    try {
      const r = await fetch(`/api/cms/rekening?id=${id}`, { method: "DELETE" });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        await alert(j.error ?? "Gagal menghapus rekening", "Gagal Hapus", "error");
      } else {
        toast.success("Rekening berhasil dihapus.");
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
        title="Rekening Pembayaran"
        desc="Nomor yang aktif tampil otomatis di halaman booking. Matikan (bukan hapus) jika sementara tidak dipakai."
        action={<AddButton onClick={openCreateModal} label="Tambah Rekening" />}
      />

      {data.length === 0 ? (
        <Empty text="Belum ada rekening." />
      ) : (
        <TableShell>
          <thead>
            <tr>
              <Th sortable sortDirection={sortCol === "urutan" ? sortDir : null} onSort={() => handleSort("urutan")}>Urutan</Th>
              <Th sortable sortDirection={sortCol === "bank" ? sortDir : null} onSort={() => handleSort("bank")}>Bank</Th>
              <Th sortable sortDirection={sortCol === "nomor" ? sortDir : null} onSort={() => handleSort("nomor")}>Nomor</Th>
              <Th sortable sortDirection={sortCol === "atasNama" ? sortDir : null} onSort={() => handleSort("atasNama")}>Atas Nama</Th>
              <Th sortable sortDirection={sortCol === "aktif" ? sortDir : null} onSort={() => handleSort("aktif")}>Tampil di Website</Th>
              <Th className="text-right">Aksi</Th>
            </tr>
          </thead>
          <tbody>
            {sortedData.map((r) => (
              <tr key={r.id} className="transition hover:bg-stone-50">
                <Td className="text-stone-400">{r.urutan}</Td>
                <Td>
                  <span className="font-bold text-stone-900">{r.bank}</span>
                </Td>
                <Td className="font-mono tracking-wider">{r.nomor}</Td>
                <Td className="text-stone-500">{r.atasNama}</Td>
                <Td>
                  <div className="flex items-center gap-2">
                    <Switch on={r.aktif} onClick={() => toggle(r)} />
                    <span className="text-xs text-stone-500">{r.aktif ? "Tampil" : "Sembunyi"}</span>
                  </div>
                </Td>
                <Td className="text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <RowBtn onClick={() => openEditModal(r)} title="Edit Rekening">
                      <Pencil size={14} />
                    </RowBtn>
                    <RowBtn tone="danger" onClick={() => hapus(r.id)} title="Hapus Rekening">
                      <Trash2 size={14} />
                    </RowBtn>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      )}

      {/* Modal Form Tambah / Edit Rekening */}
      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title={editingId ? "Edit Rekening Pembayaran" : "Tambah Rekening Baru"}
        desc={editingId ? "Ubah rincian rekening di bawah ini." : "Rekening aktif langsung tampil di halaman booking."}
      >
        <form onSubmit={handleSubmit} className="grid gap-3">
          <div>
            <Label>Bank / E-wallet</Label>
            <Input
              value={form.bank}
              onChange={(e) => setForm({ ...form, bank: e.target.value })}
              placeholder="cth BCA / Mandiri / DANA"
              required
            />
          </div>
          <div>
            <Label>Nomor Rekening / HP</Label>
            <Input
              value={form.nomor}
              onChange={(e) => setForm({ ...form, nomor: e.target.value })}
              placeholder="cth 1234566285728818103"
              required
            />
          </div>
          <div>
            <Label>Atas Nama</Label>
            <Input
              value={form.atasNama}
              onChange={(e) => setForm({ ...form, atasNama: e.target.value })}
              required
            />
          </div>
          <div>
            <Label>Urutan Tampil (opsional)</Label>
            <Input
              type="number"
              value={form.urutan}
              onChange={(e) => setForm({ ...form, urutan: e.target.value })}
              placeholder="otomatis di akhir"
            />
          </div>

          {err && <p className="text-sm font-semibold text-rose-600">{err}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setModal(false)}
              className="rounded-full border border-stone-300 px-5 py-2.5 text-sm font-medium hover:bg-stone-50 cursor-pointer"
            >
              Batal
            </button>
            <Btn disabled={saving}>{saving ? "Menyimpan..." : editingId ? "Simpan Perubahan" : "Simpan"}</Btn>
          </div>
        </form>
      </Modal>
    </div>
  );
}
