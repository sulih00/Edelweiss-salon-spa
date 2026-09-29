"use client";
import { useEffect, useState, useCallback, useMemo } from "react";
import { Input, Label, Btn } from "@/components/ui";
import { Modal, PageHeader, AddButton, TableShell, Th, Td, Badge, RowBtn, Empty, Pagination } from "@/components/admin";

type U = { id: string; name: string; email: string; role: string };

export default function UsersClient() {
  const [data, setData] = useState<U[]>([]);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "KASIR" });
  const [err, setErr] = useState("");
  const [modal, setModal] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const totalPages = Math.ceil(data.length / pageSize);
  const paginated = useMemo(() => {
    return data.slice((page - 1) * pageSize, page * pageSize);
  }, [data, page, pageSize]);

  const load = useCallback(async () => {
    const r = await fetch("/api/cms/users");
    if (r.ok) {
      const resData = await r.json();
      setData(resData);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    fetch("/api/cms/users")
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
    const r = await fetch("/api/cms/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const j = await r.json();
    if (!r.ok) setErr(j.error ?? "Gagal");
    else { setForm({ name: "", email: "", password: "", role: "KASIR" }); setModal(false); load(); }
  }

  async function hapus(id: string) {
    if (!confirm("Hapus user ini?")) return;
    const r = await fetch(`/api/cms/users?id=${id}`, { method: "DELETE" });
    const j = await r.json();
    if (!r.ok) alert(j.error ?? "Gagal");
    load();
  }

  const roleTone = (r: string) => (r === "OWNER" ? "gold" : r === "ADMIN" ? "sage" : r === "KASIR" ? "green" : "stone") as "gold" | "sage" | "green" | "stone";

  return (
    <div>
      <PageHeader
        title="Users & Hak Akses"
        desc="OWNER full control • ADMIN operasional • KASIR booking & kas • USER pelanggan."
        action={<AddButton onClick={() => setModal(true)} label="Tambah User" />}
      />

      {data.length === 0 ? <Empty text="Belum ada user." /> : (
        <>
          <TableShell>
            <thead>
              <tr><Th>Nama</Th><Th>Email</Th><Th>Role</Th><Th className="text-right">Aksi</Th></tr>
            </thead>
            <tbody>
              {paginated.map((u) => (
                <tr key={u.id} className="transition hover:bg-stone-50">
                  <Td>
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sage-700 text-sm font-bold text-white">{u.name.slice(0, 1).toUpperCase()}</span>
                      <span className="font-semibold text-stone-900">{u.name}</span>
                    </div>
                  </Td>
                  <Td className="text-stone-500">{u.email}</Td>
                  <Td><Badge tone={roleTone(u.role)}>{u.role}</Badge></Td>
                  <Td className="text-right"><RowBtn tone="danger" onClick={() => hapus(u.id)}>Hapus</RowBtn></Td>
                </tr>
              ))}
            </tbody>
          </TableShell>

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            totalItems={data.length}
            pageSize={pageSize}
          />
        </>
      )}


      <Modal open={modal} onClose={() => setModal(false)} title="Tambah User" desc="Buat akun login CMS baru.">
        <form onSubmit={create} className="grid gap-3">
          <div><Label>Nama</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
          <div><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></div>
          <div><Label>Password</Label><Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required /></div>
          <div><Label>Role</Label>
            <select className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="KASIR">KASIR</option>
              <option value="ADMIN">ADMIN</option>
              <option value="OWNER">OWNER</option>
              <option value="USER">USER (Pelanggan)</option>
            </select>
          </div>
          {err && <p className="text-sm text-red-600">{err}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setModal(false)} className="rounded-full border border-stone-300 px-5 py-2.5 text-sm">Batal</button>
            <Btn>Simpan User</Btn>
          </div>
        </form>
      </Modal>
    </div>
  );
}
