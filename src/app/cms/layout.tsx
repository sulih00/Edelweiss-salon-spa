import { redirect } from "next/navigation";
import { sessionRole } from "@/lib/roles";
import { prisma } from "@/lib/prisma";
import AdminShell, { type AdminMenu } from "@/components/AdminShell";

const allMenu: (AdminMenu & { roles: string[] })[] = [
  { href: "/cms", label: "Dashboard", icon: "dashboard", roles: ["OWNER", "ADMIN", "KASIR"] },
  { href: "/cms/kasir", label: "Kasir (POS)", icon: "kasir", roles: ["OWNER", "ADMIN", "KASIR"] },
  { href: "/cms/booking", label: "Booking", icon: "booking", roles: ["OWNER", "ADMIN", "KASIR"] },
  { href: "/cms/produk", label: "Produk & Layanan", icon: "produk", roles: ["OWNER", "ADMIN", "KASIR"] },
  { href: "/cms/keuangan", label: "Keuangan", icon: "keuangan", roles: ["OWNER", "ADMIN", "KASIR"] },
  { href: "/cms/rekening", label: "Rekening", icon: "rekening", roles: ["OWNER", "ADMIN"] },
  { href: "/cms/laporan", label: "Laporan", icon: "laporan", roles: ["OWNER", "ADMIN"] },
  { href: "/cms/promo", label: "Promo", icon: "promo", roles: ["OWNER", "ADMIN"] },
  { href: "/cms/galeri", label: "Galeri", icon: "galeri", roles: ["OWNER", "ADMIN"] },
  { href: "/cms/testimoni", label: "Testimoni", icon: "testimoni", roles: ["OWNER", "ADMIN"] },
  { href: "/cms/pelanggan", label: "Pelanggan", icon: "pelanggan", roles: ["OWNER", "ADMIN", "KASIR"] },
  { href: "/cms/karyawan", label: "Karyawan", icon: "karyawan", roles: ["OWNER", "ADMIN"] },
  { href: "/cms/lokasi", label: "Maps & Lokasi", icon: "lokasi", roles: ["OWNER", "ADMIN"] },
  { href: "/cms/users", label: "Users", icon: "users", roles: ["OWNER"] },
];

export default async function CmsLayout({ children }: { children: React.ReactNode }) {
  const s = await sessionRole();
  if (!s) redirect("/login");
  const menu = allMenu.filter((m) => m.roles.includes(s.role)).map(({ href, label, icon }) => ({ href, label, icon }));

  const [notifCount, pending] = await Promise.all([
    prisma.booking.count({ where: { status: "BARU" } }),
    prisma.booking.findMany({
      where: { status: "BARU" },
      include: { pelanggan: true, produk: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  return (
    <AdminShell
      menu={menu}
      email={s.email}
      role={s.role}
      notifCount={notifCount}
      notifItems={pending.map((b) => ({
        id: b.id,
        nama: b.pelanggan.nama,
        layanan: b.produk.nama,
        jadwal: b.jadwal.toISOString(),
      }))}
    >
      {children}
    </AdminShell>
  );
}
