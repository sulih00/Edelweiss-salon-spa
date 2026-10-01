"use client";
import { useEffect, useState, useCallback, useMemo } from "react";
import { Input, Label, Btn, useAlert } from "@/components/ui";
import { Modal, PageHeader, AddButton, TableShell, Th, Td, Badge, RowBtn, Empty, Pagination } from "@/components/admin";

type U = { id: string; name: string; email: string; role: string };

const emptyForm = { name: "", email: "", password: "", role: "KASIR" };

export default function UsersClient() {
  const { alert, confirm, toast } = useAlert();
  const [data, setData] = useState<U[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [err, setErr] = useState("");
  const [modal, setModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const totalPages = Math.ceil(data.length / pageSize);
  const paginated = useMemo(() => {
    return data.slice((page - 1) * pageSize, page * pageSize);
  }, [data, page, pageSize]);

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/cms/users");
      if (r.ok) {
        const resData = await r.json();
        setData(resData);
      }
    } catch (e) {
      console.error("Gagal memuat users:", e);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    fetch("/api/cms/users")
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

  function openEditModal(user: U) {
    setEditingId(user.id);
    setForm({
      name: user.name,
      email: user.email,
      password: "", // Kosongkan jika tidak mau ubah password
      role: user.role,
    });
    setErr("");
    setModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setSaving(true);

    const payload = editingId
      ? { id: editingId, ...form }
      : form;

    try {
      const r = await fetch("/api/cms/users", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const j = await r.json();
      setSaving(false);

      if (!r.ok) {
        setErr(j.error ?? "Gagal menyimpan user");
        return;
      }

      toast.success(editingId ? "Data user berhasil diperbarui!" : "User baru berhasil dibuat!");
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

  async function hapus(id: string) {
    const isOk = await confirm("Apakah Anda yakin ingin menghapus user ini?", "Konfirmasi Hapus User");
    if (!isOk) return;
    const r = await fetch(`/api/cms/users?id=${id}`, { method: "DELETE" });
    const j = await r.json();
    if (!r.ok) {
      await alert(j.error ?? "Gagal menghapus user", "Gagal", "error");
    } else {
      toast.success("User telah dihapus.");
      load();
    }
  }

  const roleTone = (r: string) =>
    (r === "OWNER" ? "gold" : r === "ADMIN" ? "sage" : r === "KASIR" ? "green" : "stone") as
      | "gold"
      | "sage"
      | "green"
      | "stone";

  return (
    <div>
      <PageHeader
        title="Users & Hak Akses"
        desc="OWNER full control • ADMIN operasional • KASIR booking & kas • USER pelanggan."
        action={<AddButton onClick={openCreateModal} label="Tambah User" />}
      />

      {data.length === 0 ? (
        <Empty text="Belum ada user." />
      ) : (
        <>
          <TableShell>
            <thead>
              <tr>
                <Th>Nama</Th>
                <Th>Email</Th>
                <Th>Role</Th>
                <Th className="text-right">Aksi</Th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((u) => (
                <tr key={u.id} className="transition hover:bg-stone-50">
                  <Td>
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sage-700 text-sm font-bold text-white">
                        {u.name.slice(0, 1).toUpperCase()}
                      </span>
                      <span className="font-semibold text-stone-900">{u.name}</span>
                    </div>
                  </Td>
                  <Td className="text-stone-500">{u.email}</Td>
                  <Td>
                    <Badge tone={roleTone(u.role)}>{u.role}</Badge>
                  </Td>
                  <Td className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <RowBtn onClick={() => openEditModal(u)}>Edit</RowBtn>
                      <RowBtn tone="danger" onClick={() => hapus(u.id)}>
                        Hapus
                      </RowBtn>
                    </div>
                  </Td>
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

      {/* Modal Form Tambah / Edit User */}
      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title={editingId ? "Edit User & Hak Akses" : "Tambah User Baru"}
        desc={editingId ? "Ubah data akun atau role user di bawah ini." : "Buat akun login CMS baru."}
      >
        <form onSubmit={handleSubmit} className="grid gap-3">
          <div>
            <Label>Nama</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              placeholder="Nama Lengkap User"
            />
          </div>
          <div>
            <Label>Email</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              placeholder="email@domain.com"
            />
          </div>
          <div>
            <Label>{editingId ? "Password Baru (Biarkan kosong jika tidak diubah)" : "Password *"}</Label>
            <Input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required={!editingId}
              placeholder={editingId ? "•••••••• (opsional)" : "Password rahasia"}
            />
          </div>
          <div>
            <Label>Role Hak Akses</Label>
            <select
              className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm outline-none focus:border-sage-600"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              <option value="KASIR">KASIR (Kasir & Booking)</option>
              <option value="ADMIN">ADMIN (Operasional Complete)</option>
              <option value="OWNER">OWNER (Full Control)</option>
              <option value="USER">USER (Pelanggan)</option>
            </select>
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
            <Btn disabled={saving}>{saving ? "Menyimpan..." : editingId ? "Simpan Perubahan" : "Simpan User"}</Btn>
          </div>
        </form>
      </Modal>
    </div>
  );
}
