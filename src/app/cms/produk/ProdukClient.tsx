"use client";
import { useEffect, useState, useCallback, useMemo } from "react";
import { Input, Label, Btn, useAlert } from "@/components/ui";
import { Modal, PageHeader, AddButton, TableShell, Th, Td, Badge, RowBtn, Empty, Switch, FilterTabs, Pagination } from "@/components/admin";
import { rupiah } from "@/lib/utils";
import { Search } from "lucide-react";

type P = { id: string; nama: string; harga: number; stok: number; isLayanan: boolean; aktif: boolean; foto?: string | null; kategori: { id: string; nama: string }; kategoriId: string; deskripsi?: string | null; durasiMenit: number };
type K = { id: string; nama: string };

async function uploadFoto(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const r = await fetch("/api/cms/upload", { method: "POST", body: fd });
  const j = await r.json();
  if (!r.ok) throw new Error(j.error ?? "Upload gagal");
  return j.url as string;
}

const empty = { nama: "", kategoriId: "", harga: "100000", durasiMenit: "60", stok: "0", deskripsi: "", isLayanan: true, foto: "" };

export default function ProdukClient({ canDelete = true }: { canDelete?: boolean }) {
  const { alert, confirm, toast } = useAlert();
  const [data, setData] = useState<P[]>([]);
  const [kat, setKat] = useState<K[]>([]);
  const [form, setForm] = useState(empty);
  const [uploading, setUploading] = useState(false);
  const [modal, setModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"semua" | "tampil" | "sembunyi">("semua");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const tampilCount = data.filter((d) => d.aktif).length;
  const shown = useMemo(() => {
    return data.filter(
      (d) =>
        (filter === "semua" || (filter === "tampil" ? d.aktif : !d.aktif)) &&
        (d.nama.toLowerCase().includes(q.toLowerCase()) || d.kategori.nama.toLowerCase().includes(q.toLowerCase()))
    );
  }, [data, filter, q]);

  const totalPages = Math.ceil(shown.length / pageSize);
  const paginated = useMemo(() => {
    return shown.slice((page - 1) * pageSize, page * pageSize);
  }, [shown, page, pageSize]);


  const load = useCallback(async () => {
    const r = await fetch("/api/cms/produk");
    const j = await r.json();
    const produkList = Array.isArray(j) ? j : j.produk ?? [];
    const katList = Array.isArray(j) ? [] : j.kategori ?? [];
    setData(produkList);
    setKat(katList);
    if (katList[0]) setForm((f) => (f.kategoriId ? f : { ...f, kategoriId: katList[0].id }));
  }, []);

  useEffect(() => {
    let mounted = true;
    fetch("/api/cms/produk")
      .then((r) => r.json())
      .then((j) => {
        if (!mounted) return;
        const produkList = Array.isArray(j) ? j : j.produk ?? [];
        const katList = Array.isArray(j) ? [] : j.kategori ?? [];
        setData(produkList);
        setKat(katList);
        if (katList[0]) setForm((f) => (f.kategoriId ? f : { ...f, kategoriId: katList[0].id }));
      });
    return () => {
      mounted = false;
    };
  }, []);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setUploading(true);
    try {
      const url = await uploadFoto(f);
      setForm((s) => ({ ...s, foto: url }));
      toast.success("Foto produk berhasil diupload");
    } catch (err) {
      await alert(err instanceof Error ? err.message : "Upload gagal", "Gagal Upload", "error");
    }
    setUploading(false);
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/cms/produk", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, harga: Number(form.harga) }) });
    setSaving(false);
    setForm({ ...empty, kategoriId: kat[0]?.id ?? "" });
    setModal(false);
    load();
  }

  async function toggle(p: P) {
    await fetch("/api/cms/produk", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: p.id, aktif: !p.aktif }) });
    load();
  }
  async function hapus(id: string) {
    const isOk = await confirm("Hapus produk ini?", "Konfirmasi Hapus Produk");
    if (!isOk) return;
    const r = await fetch(`/api/cms/produk?id=${id}`, { method: "DELETE" });
    if (!r.ok) {
      const j = await r.json().catch(() => ({}));
      await alert(j.error ?? "Gagal: hanya OWNER/ADMIN yang bisa hapus", "Akses Ditolak", "error");
    } else {
      toast.success("Produk berhasil dihapus.");
    }
    load();
  }

  return (
    <div>
      <PageHeader
        title="Produk & Layanan"
        desc={`${tampilCount} dari ${data.length} tampil di website.`}
        action={<AddButton onClick={() => setModal(true)} label="Tambah Produk" />}
      />

      <div className="mb-4 flex flex-col gap-2.5 lg:flex-row lg:items-center">
        <FilterTabs
          value={filter}
          onChange={setFilter}
          options={[
            { value: "semua", label: "Semua", count: data.length },
            { value: "tampil", label: "Tampil di Website", count: tampilCount },
            { value: "sembunyi", label: "Disembunyikan", count: data.length - tampilCount },
          ]}
        />
        <div className="relative lg:ml-auto lg:w-64">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari nama / kategori..."
            className="w-full rounded-2xl border border-stone-200/70 bg-white py-2 pl-10 pr-4 text-sm shadow-sm outline-none focus:border-sage-600"
          />
        </div>
      </div>

      {shown.length === 0 ? <Empty text={data.length === 0 ? "Belum ada produk. Klik Tambah Produk." : "Tidak cocok dengan filter/pencarian."} /> : (
        <>
          <TableShell>
            <thead>
              <tr><Th>Item</Th><Th>Kategori</Th><Th>Harga</Th><Th>Stok / Durasi</Th><Th>Tampil di Website</Th><Th className="text-right">Aksi</Th></tr>
            </thead>
            <tbody>
              {paginated.map((p) => (
                <tr key={p.id} className="transition hover:bg-stone-50">
                  <Td>
                    <div className="flex items-center gap-3">
                      {p.foto ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.foto} alt="" className="h-10 w-10 rounded-lg object-cover" />
                      ) : (
                        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-stone-100 text-xs font-bold text-stone-400">{p.nama.slice(0, 1)}</span>
                      )}
                      <div>
                        <p className="font-semibold text-stone-900">{p.nama}</p>
                        <p className="max-w-[220px] truncate text-xs text-stone-400">{p.deskripsi}</p>
                      </div>
                    </div>
                  </Td>
                  <Td><Badge>{p.kategori.nama}</Badge></Td>
                  <Td className="font-semibold">{rupiah(p.harga)}</Td>
                  <Td className="text-stone-500">
                    {p.isLayanan ? (
                      `${p.durasiMenit} mnt`
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <span>Stok {p.stok}</span>
                        {p.stok <= 5 && (
                          <Badge tone="red">
                            {p.stok === 0 ? "Habis" : "Menipis"}
                          </Badge>
                        )}
                      </div>
                    )}
                  </Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      <Switch on={p.aktif} onClick={() => toggle(p)} />
                      <span className="text-xs text-stone-500">{p.aktif ? "Tampil" : "Sembunyi"}</span>
                    </div>
                  </Td>
                  <Td className="text-right">
                    {canDelete && <RowBtn tone="danger" onClick={() => hapus(p.id)}>Hapus</RowBtn>}
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableShell>

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            totalItems={shown.length}
            pageSize={pageSize}
          />
        </>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="Tambah Produk / Layanan" desc="Lengkapi data di bawah, lalu simpan." wide>
        <form onSubmit={create} className="grid gap-3 md:grid-cols-2">
          <div className="md:col-span-2"><Label>Nama</Label><Input value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} required placeholder="cth Creambath Edelweiss" /></div>
          <div><Label>Kategori</Label>
            <select className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm" value={form.kategoriId} onChange={(e) => setForm({ ...form, kategoriId: e.target.value })}>
              {kat.map((k) => <option key={k.id} value={k.id}>{k.nama}</option>)}
            </select>
          </div>
          <div><Label>Tipe</Label>
            <select className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm" value={form.isLayanan ? "1" : "0"} onChange={(e) => setForm({ ...form, isLayanan: e.target.value === "1" })}>
              <option value="1">Layanan</option><option value="0">Produk retail</option>
            </select>
          </div>
          <div><Label>Harga (Rp)</Label><Input type="number" value={form.harga} onChange={(e) => setForm({ ...form, harga: e.target.value })} /></div>
          <div><Label>Durasi (mnt) / Stok</Label><Input type="number" value={form.isLayanan ? form.durasiMenit : form.stok} onChange={(e) => setForm(form.isLayanan ? { ...form, durasiMenit: e.target.value } : { ...form, stok: e.target.value })} /></div>
          <div className="md:col-span-2"><Label>Deskripsi</Label><Input value={form.deskripsi} onChange={(e) => setForm({ ...form, deskripsi: e.target.value })} /></div>
          <div className="md:col-span-2">
            <Label>Foto (maks 2MB)</Label>
            <input type="file" accept="image/*" onChange={onFile} className="w-full text-sm" />
            {form.foto && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={form.foto} alt="preview" className="mt-2 h-20 w-20 rounded-xl border object-cover" />
            )}
            {uploading && <p className="text-xs text-stone-400">Mengupload...</p>}
          </div>
          <div className="flex justify-end gap-2 md:col-span-2">
            <button type="button" onClick={() => setModal(false)} className="rounded-full border border-stone-300 px-5 py-2.5 text-sm">Batal</button>
            <Btn disabled={uploading || saving}>{saving ? "Menyimpan..." : "Simpan"}</Btn>
          </div>
        </form>
      </Modal>
    </div>
  );
}
