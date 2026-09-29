"use client";
import { useEffect, useState, useCallback } from "react";
import { Input, Label, Btn } from "@/components/ui";
import { Modal, PageHeader, AddButton, Badge, RowBtn, Empty } from "@/components/admin";

type G = { id: string; foto: string; judul?: string | null; tampil: boolean };

export default function GaleriClient() {
  const [data, setData] = useState<G[]>([]);
  const [judul, setJudul] = useState("");
  const [foto, setFoto] = useState("");
  const [uploading, setUploading] = useState(false);
  const [modal, setModal] = useState(false);

  const load = useCallback(async () => {
    const r = await fetch("/api/cms/galeri");
    setData(await r.json());
  }, []);

  useEffect(() => {
    let mounted = true;
    fetch("/api/cms/galeri")
      .then((r) => r.json())
      .then((j) => {
        if (mounted && Array.isArray(j)) setData(j);
      });
    return () => {
      mounted = false;
    };
  }, []);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", f);
    const r = await fetch("/api/cms/upload", { method: "POST", body: fd });
    const j = await r.json();
    setUploading(false);
    if (r.ok) setFoto(j.url);
    else alert(j.error ?? "Upload gagal");
  }

  function openModal() {
    setFoto(""); setJudul(""); setModal(true);
  }

  async function tambah(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/cms/galeri", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ foto, judul }) });
    setFoto(""); setJudul(""); setModal(false); load();
  }

  async function toggle(g: G) {
    await fetch("/api/cms/galeri", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: g.id, tampil: !g.tampil }) });
    load();
  }

  async function hapus(id: string) {
    if (!confirm("Hapus foto?")) return;
    await fetch(`/api/cms/galeri?id=${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <PageHeader title="Galeri" desc={`${data.length} foto.`} action={<AddButton onClick={openModal} label="Tambah Foto" />} />

      {data.length === 0 ? <Empty text="Belum ada foto." /> : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {data.map((g) => (
            <div key={g.id} className={`overflow-hidden rounded-2xl border border-stone-200/70 bg-white shadow-sm ${g.tampil ? "" : "opacity-60"}`}>
              {g.foto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={g.foto} alt={g.judul ?? ""} className="h-44 w-full object-cover" />
              ) : (
                <div className="flex h-44 w-full items-center justify-center bg-sage-100 p-4 text-center">
                  <p className="font-serif-display font-semibold text-sage-800">{g.judul || "Foto Galeri"}</p>
                </div>
              )}
              <div className="flex items-center justify-between gap-2 p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-stone-900">{g.judul || "Tanpa judul"}</p>
                  <Badge tone={g.tampil ? "green" : "stone"}>{g.tampil ? "Tampil" : "Disembunyikan"}</Badge>
                </div>
                <div className="flex shrink-0 gap-1.5">
                  <RowBtn onClick={() => toggle(g)}>{g.tampil ? "Sembunyikan" : "Tampilkan"}</RowBtn>
                  <RowBtn tone="danger" onClick={() => hapus(g.id)}>Hapus</RowBtn>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="Tambah Foto Galeri" desc="Maksimal 2MB per foto.">
        <form onSubmit={tambah} className="grid gap-3">
          <div>
            <Label>Foto</Label>
            <input type="file" accept="image/*" onChange={onFile} className="w-full text-sm" />
            {foto && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={foto} alt="preview" className="mt-2 h-32 w-full rounded-xl border object-cover" />
            )}
            {uploading && <p className="text-xs text-stone-400">Mengupload...</p>}
          </div>
          <div><Label>Judul</Label><Input value={judul} onChange={(e) => setJudul(e.target.value)} placeholder="Ruang Spa Edelweiss" /></div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setModal(false)} className="rounded-full border border-stone-300 px-5 py-2.5 text-sm">Batal</button>
            <Btn disabled={!foto || uploading}>{uploading ? "Upload..." : "Simpan"}</Btn>
          </div>
        </form>
      </Modal>
    </div>
  );
}
