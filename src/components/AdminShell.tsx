"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
  LayoutDashboard, CalendarCheck, Scissors, Wallet, TicketPercent,
  Image as ImageIcon, Users, Briefcase, ShieldCheck, ShoppingCart,
  Menu, Globe, LogOut, Bell, ChevronDown, CalendarDays, CircleCheck, FileText, Landmark, MessageSquareHeart, MapPin,
  ChevronRight, Home,
} from "lucide-react";
import { cn } from "@/lib/utils";

const pathLabels: Record<string, string> = {
  "/cms": "Dashboard",
  "/cms/kasir": "Kasir (POS)",
  "/cms/booking": "Booking & Jadwal",
  "/cms/produk": "Produk & Layanan",
  "/cms/keuangan": "Keuangan Salon",
  "/cms/rekening": "Rekening Bank",
  "/cms/laporan": "Laporan Rekap",
  "/cms/promo": "Voucher & Promo",
  "/cms/galeri": "Galeri Foto",
  "/cms/testimoni": "Testimoni Pelanggan",
  "/cms/pelanggan": "Data Pelanggan",
  "/cms/karyawan": "Manajemen Karyawan",
  "/cms/lokasi": "Maps & Lokasi",
  "/cms/users": "Manajemen User",
};

const icons: Record<string, React.ReactNode> = {
  dashboard: <LayoutDashboard size={18} />,
  kasir: <ShoppingCart size={18} />,
  booking: <CalendarCheck size={18} />,
  produk: <Scissors size={18} />,
  keuangan: <Wallet size={18} />,
  rekening: <Landmark size={18} />,
  laporan: <FileText size={18} />,
  promo: <TicketPercent size={18} />,
  galeri: <ImageIcon size={18} />,
  testimoni: <MessageSquareHeart size={18} />,
  pelanggan: <Users size={18} />,
  karyawan: <Briefcase size={18} />,
  users: <ShieldCheck size={18} />,
  lokasi: <MapPin size={18} />,
};

export type AdminMenu = { href: string; label: string; icon: string };
export type NotifItem = { id: string; nama: string; layanan: string; jadwal: string };

function useToday() {
  const [today] = useState(() =>
    new Intl.DateTimeFormat("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date())
  );
  return today;
}

export default function AdminShell({
  menu,
  email,
  role,
  notifCount = 0,
  notifItems = [],
  children,
}: {
  menu: AdminMenu[];
  email: string;
  role: string;
  notifCount?: number;
  notifItems?: NotifItem[];
  children: React.ReactNode;
}) {
  const [drawer, setDrawer] = useState(false);
  const [drop, setDrop] = useState<"notif" | "user" | null>(null);
  const path = usePathname();
  const today = useToday();
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!drop) return;
    const fn = (e: MouseEvent) => {
      if (barRef.current && !barRef.current.contains(e.target as Node)) setDrop(null);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, [drop]);

  const initial = (email?.[0] ?? "A").toUpperCase();
  const activeLabel = menu.find((m) => m.href === path)?.label ?? "Dashboard";

  const getBreadcrumbs = () => {
    if (path === "/cms") {
      return [{ label: "Dashboard" }];
    }
    const matchedMenu = menu.find((m) => m.href === path);
    if (matchedMenu) {
      return [{ label: matchedMenu.label }];
    }
    if (path.startsWith("/cms/struk")) {
      return [{ label: "Booking & Jadwal", href: "/cms/booking" }, { label: "Detail Struk Nota" }];
    }
    const segments = path.split("/").filter(Boolean);
    return segments.slice(1).map((s, idx) => {
      const subPath = "/cms/" + segments.slice(1, idx + 2).join("/");
      const label = pathLabels[subPath] ?? s.charAt(0).toUpperCase() + s.slice(1);
      return idx === segments.length - 2 ? { label } : { label, href: subPath };
    });
  };

  const breadcrumbs = getBreadcrumbs();
  const currentTitle = breadcrumbs[breadcrumbs.length - 1]?.label ?? activeLabel;

  const sidebar = (
    <div className="flex h-full flex-col bg-sage-900 text-sage-100">
      <Link href="/cms" className="flex items-center gap-3 px-5 pb-5 pt-6" onClick={() => setDrawer(false)}>
        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-gold-400/40 bg-white shadow-md">
          <Image
            src="/logo.png"
            alt="Edelweiss Admin Logo"
            fill
            sizes="40px"
            className="object-cover"
          />
        </div>
        <span>
          <span className="font-serif-display block text-lg font-bold leading-none text-white">Edelweiss</span>
          <span className="mt-1 block text-[10px] tracking-[0.25em] text-gold-300">ADMIN PANEL</span>
        </span>
      </Link>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3">
        {menu.map((m) => {
          const active = path === m.href;
          return (
            <Link
              key={m.href}
              href={m.href}
              onClick={() => setDrawer(false)}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm transition",
                active ? "bg-white/10 font-semibold text-white shadow-inner" : "text-sage-100/70 hover:bg-white/5 hover:text-white"
              )}
            >
              <span className={active ? "text-gold-300" : "text-sage-100/50"}>{icons[m.icon]}</span>
              {m.label}
              {m.href === "/cms/booking" && notifCount > 0 && (
                <span className="ml-auto rounded-full bg-gold-400 px-2 py-0.5 text-[11px] font-bold text-sage-900">{notifCount}</span>
              )}
            </Link>
          );
        })}
      </nav>
      <div className="space-y-1 border-t border-white/10 p-3">
        <Link href="/" className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm text-sage-100/70 transition hover:bg-white/5 hover:text-white">
          <Globe size={18} /> Lihat Website
        </Link>
        <Link href="/api/auth/signout" className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm text-red-300 transition hover:bg-red-500/10">
          <LogOut size={18} /> Keluar
        </Link>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-stone-100">
      {/* Sidebar desktop */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 print:hidden md:block">{sidebar}</aside>

      {/* Drawer mobile */}
      {drawer && (
        <div className="fixed inset-0 z-[60] print:hidden md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDrawer(false)} />
          <aside className="animate-bloom absolute left-0 top-0 h-full w-72 shadow-2xl">{sidebar}</aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* ===== Topbar ===== */}
        <header className="sticky top-0 z-40 border-b border-stone-200 bg-white/90 shadow-[0_1px_12px_-6px_rgba(0,0,0,0.1)] backdrop-blur print:hidden">
          <div ref={barRef} className="relative flex items-center gap-3 px-4 py-3 md:px-8">
            <button onClick={() => setDrawer(true)} className="rounded-xl border border-stone-200 p-2 text-stone-600 transition hover:bg-stone-50 md:hidden" aria-label="Menu">
              <Menu size={18} />
            </button>

            <div className="min-w-0 flex-1">
              <nav className="flex items-center gap-1.5 text-xs overflow-x-auto no-scrollbar py-0.5">
                <Link
                  href="/cms"
                  className="flex items-center gap-1 font-medium text-stone-500 hover:text-sage-700 transition shrink-0"
                >
                  <Home size={13} className="text-sage-600 shrink-0" />
                  <span>Admin</span>
                </Link>
                {breadcrumbs.map((b, idx) => (
                  <span key={idx} className="flex items-center gap-1.5 shrink-0">
                    <ChevronRight size={12} className="text-gold-400 shrink-0" />
                    {b.href ? (
                      <Link href={b.href} className="font-medium text-stone-500 hover:text-sage-700 transition">
                        {b.label}
                      </Link>
                    ) : (
                      <span className="font-semibold text-sage-900 bg-sage-50 px-2 py-0.5 rounded-lg border border-sage-200/80 shadow-2xs">
                        {b.label}
                      </span>
                    )}
                  </span>
                ))}
              </nav>
              <h2 className="truncate text-base font-bold text-stone-900 md:text-lg">{currentTitle}</h2>
            </div>

            <p className="ml-2 hidden items-center gap-1.5 text-xs text-stone-400 lg:flex">
              <CalendarDays size={14} /> {today}
            </p>

            <div className="ml-auto flex items-center gap-2">
              {/* Lonceng notifikasi */}
              <div className="relative">
                <button
                  onClick={() => setDrop(drop === "notif" ? null : "notif")}
                  className={cn(
                    "relative rounded-xl border p-2.5 transition",
                    drop === "notif" ? "border-sage-600 bg-sage-50 text-sage-700" : "border-stone-200 text-stone-500 hover:bg-stone-50"
                  )}
                  aria-label="Notifikasi"
                >
                  <Bell size={18} />
                  {notifCount > 0 && (
                    <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                      {notifCount > 9 ? "9+" : notifCount}
                    </span>
                  )}
                </button>
                {drop === "notif" && (
                  <div className="animate-bloom absolute right-0 top-12 w-80 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xl">
                    <div className="border-b border-stone-100 px-4 py-3">
                      <p className="text-sm font-bold text-stone-900">Booking perlu konfirmasi</p>
                      <p className="text-xs text-stone-400">{notifCount} menunggu tindakan</p>
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                      {notifItems.length === 0 && <p className="px-4 py-6 text-center text-sm text-stone-400">Semua booking sudah ditangani 🎉</p>}
                      {notifItems.map((n) => (
                        <Link key={n.id} href="/cms/booking" onClick={() => setDrop(null)} className="flex gap-3 border-b border-stone-50 px-4 py-3 transition last:border-0 hover:bg-sage-50/60">
                          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold-400/20 text-gold-600">
                            <CalendarCheck size={15} />
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-semibold text-stone-800">{n.nama} — {n.layanan}</span>
                            <span className="block text-xs text-stone-400">{new Date(n.jadwal).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })}</span>
                          </span>
                        </Link>
                      ))}
                    </div>
                    <Link href="/cms/booking" onClick={() => setDrop(null)} className="block bg-stone-50 px-4 py-2.5 text-center text-xs font-bold text-sage-700 transition hover:bg-sage-50">
                      Lihat semua booking
                    </Link>
                  </div>
                )}
              </div>

              <span className="hidden h-8 w-px bg-stone-200 sm:block" />

              {/* Menu user */}
              <div className="relative">
                <button
                  onClick={() => setDrop(drop === "user" ? null : "user")}
                  className={cn(
                    "flex items-center gap-2.5 rounded-xl border p-1.5 pr-2.5 transition",
                    drop === "user" ? "border-sage-600 bg-sage-50" : "border-transparent hover:border-stone-200 hover:bg-white"
                  )}
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-sage-600 to-sage-800 text-sm font-bold text-white">{initial}</span>
                  <span className="hidden text-left leading-tight sm:block">
                    <span className="block max-w-[150px] truncate text-sm font-semibold text-stone-800">{email}</span>
                    <span className="mt-0.5 inline-block rounded-full bg-sage-50 px-2 py-px text-[10px] font-bold text-sage-700">{role}</span>
                  </span>
                  <ChevronDown size={15} className={cn("text-stone-400 transition", drop === "user" && "rotate-180")} />
                </button>
                {drop === "user" && (
                  <div className="animate-bloom absolute right-0 top-13 w-56 overflow-hidden rounded-2xl border border-stone-200 bg-white py-1.5 shadow-2xl">
                    <div className="border-b border-stone-100 px-4 py-3">
                      <p className="truncate text-sm font-bold text-stone-900">{email}</p>
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-green-600">
                        <CircleCheck size={12} /> Online sebagai {role}
                      </p>
                    </div>
                    <Link href="/" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-stone-600 transition hover:bg-stone-50">
                      <Globe size={15} /> Lihat Website
                    </Link>
                    <Link href="/api/auth/signout" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 transition hover:bg-red-50">
                      <LogOut size={15} /> Keluar
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 md:px-8">{children}</main>

        {/* ===== Footer ===== */}
        <footer className="border-t border-stone-200 bg-white px-4 py-4 print:hidden md:px-8">
          <div className="flex flex-col items-center justify-between gap-3 text-xs text-stone-400 sm:flex-row">
            <p className="flex items-center gap-2">
              <span className="relative flex h-6 w-6 shrink-0 overflow-hidden rounded-full border border-gold-400/30 bg-white">
                <Image src="/logo.png" alt="Edelweiss" fill sizes="24px" className="object-cover" />
              </span>
              © {new Date().getFullYear()} <b className="text-stone-600">Edelweiss Salon Makeup Art</b> • Admin Panel v1.0
            </p>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="absolute h-full w-full animate-ping rounded-full bg-green-500 opacity-60" />
                  <span className="relative h-2 w-2 rounded-full bg-green-500" />
                </span>
                Sistem online
              </span>
              <Link href="/" className="transition hover:text-sage-700">Website</Link>
              <Link href="/cms/booking" className="transition hover:text-sage-700">Booking</Link>
              <Link href="/cms/keuangan" className="transition hover:text-sage-700">Keuangan</Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
