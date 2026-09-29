"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Input, Label } from "@/components/ui";
import { rupiah } from "@/lib/utils";
import {
  Search, ShoppingCart, User, Phone, Scissors,
  CreditCard, TicketPercent, CheckCircle, ArrowRight, RefreshCw, Sparkles, Plus, Minus, Trash2, LayoutGrid, List, UserCheck, Tag, X, Check
} from "lucide-react";

interface Produk {
  id: string;
  nama: string;
  harga: number;
  foto?: string | null;
  isLayanan: boolean;
  stok: number;
  kategori: { id: string; nama: string };
  durasiMenit: number;
}

interface Karyawan {
  id: string;
  nama: string;
  jabatan: string;
}

interface Promo {
  id: string;
  kode: string;
  nama: string;
  tipe: string;
  nilai: number;
  maxDiskon?: number | null;
}

interface PelangganSummary {
  id: string;
  nama: string;
  wa: string;
  poin: number;
}

export default function KasirClient() {
  const router = useRouter();
  const [produkList, setProdukList] = useState<Produk[]>([]);
  const [karyawanList, setKaryawanList] = useState<Karyawan[]>([]);
  const [promoList, setPromoList] = useState<Promo[]>([]);
  const [pelangganList, setPelangganList] = useState<PelangganSummary[]>([]);
  const [loading, setLoading] = useState(true);

  // View Mode state: Grid vs List
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Cart State (Multi-Item Support)
  type CartItem = { produk: Produk; karyawanId: string; qty: number };
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedKaryawanGlobal, setSelectedKaryawanGlobal] = useState<string>("");

  const [nama, setNama] = useState("");
  const [wa, setWa] = useState("");
  const [metodeBayar, setMetodeBayar] = useState<"TUNAI" | "TRANSFER" | "QRIS" | "DEBIT" | "SPLIT">("TUNAI");
  const [paymentMode, setPaymentMode] = useState<"SINGLE" | "SPLIT" | "DP">("SINGLE");

  // Poin Loyalitas State
  const [tukarPoinActive, setTukarPoinActive] = useState<boolean>(false);
  const [pakaiPoinInput, setPakaiPoinInput] = useState<string>("0");

  // Split Payment State
  const [splitMetode1, setSplitMetode1] = useState<"TUNAI" | "TRANSFER" | "QRIS" | "DEBIT">("TUNAI");
  const [splitJumlah1, setSplitJumlah1] = useState<string>("0");
  const [splitMetode2, setSplitMetode2] = useState<"TUNAI" | "TRANSFER" | "QRIS" | "DEBIT">("QRIS");

  // DP State
  const [dpAmountInput, setDpAmountInput] = useState<string>("50000");

  const [kodePromo, setKodePromo] = useState("");
  const [diskonManual, setDiskonManual] = useState("0");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");

  // Search, Filter & Pagination
  const [q, setQ] = useState("");
  const [activeKat, setActiveKat] = useState<string>("semua");

  // Load POS data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/cms/kasir");
      if (res.ok) {
        const j = await res.json();
        setProdukList(j.produk ?? []);
        setKaryawanList(j.karyawan ?? []);
        setPromoList(j.promo ?? []);
        setPelangganList(j.pelanggan ?? []);
      }
    } catch (e) {
      console.error("Gagal load data POS:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    fetch("/api/cms/kasir")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (mounted && j) {
          setProdukList(j.produk ?? []);
          setKaryawanList(j.karyawan ?? []);
          setPromoList(j.promo ?? []);
          setPelangganList(j.pelanggan ?? []);
          setLoading(false);
        }
      });
    return () => {
      mounted = false;
    };
  }, []);

  // Cart Helper Handlers
  const addToCart = (p: Produk) => {
    setCart((prev) => {
      const idx = prev.findIndex((item) => item.produk.id === p.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], qty: updated[idx].qty + 1 };
        return updated;
      }
      return [...prev, { produk: p, karyawanId: selectedKaryawanGlobal, qty: 1 }];
    });
  };

  const removeFromCart = (produkId: string) => {
    setCart((prev) => prev.filter((item) => item.produk.id !== produkId));
  };

  const updateQty = (produkId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.produk.id === produkId) {
            const nextQty = item.qty + delta;
            return nextQty > 0 ? { ...item, qty: nextQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const updateItemTherapist = (produkId: string, karyawanId: string) => {
    setCart((prev) =>
      prev.map((item) => (item.produk.id === produkId ? { ...item, karyawanId } : item))
    );
  };

  // Filter Categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    produkList.forEach((p) => {
      if (p.kategori?.nama) set.add(p.kategori.nama);
    });
    return Array.from(set);
  }, [produkList]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return produkList.filter((p) => {
      const matchQ = p.nama.toLowerCase().includes(q.toLowerCase()) || p.kategori?.nama.toLowerCase().includes(q.toLowerCase());
      const matchKat = activeKat === "semua" || p.kategori?.nama === activeKat;
      return matchQ && matchKat;
    });
  }, [produkList, q, activeKat]);

  // Customer Loyalty Points Lookup
  const foundPelanggan = useMemo(() => {
    if (!wa.trim()) return null;
    const clean = wa.replace(/[^0-9]/g, "");
    return pelangganList.find((p) => p.wa === clean) || null;
  }, [wa, pelangganList]);

  const numPakaiPoin = useMemo(() => {
    if (!tukarPoinActive || !foundPelanggan || foundPelanggan.poin <= 0) return 0;
    const requested = Number(pakaiPoinInput) || 0;
    return Math.min(foundPelanggan.poin, Math.max(0, requested));
  }, [tukarPoinActive, foundPelanggan, pakaiPoinInput]);

  const diskonPoin = useMemo(() => {
    return numPakaiPoin * 1000;
  }, [numPakaiPoin]);

  // Subtotal Calculation
  const subtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.produk.harga * item.qty, 0);
  }, [cart]);

  // Applied Promo Calculation
  const appliedPromo = useMemo(() => {
    if (!kodePromo.trim() || subtotal <= 0) return null;
    const p = promoList.find((pr) => pr.kode.toUpperCase() === kodePromo.trim().toUpperCase());
    if (!p) return null;
    let hitungDiskon = 0;
    if (p.tipe === "PERSEN") {
      const calc = Math.round((subtotal * p.nilai) / 100);
      hitungDiskon = p.maxDiskon ? Math.min(calc, p.maxDiskon) : calc;
    } else {
      hitungDiskon = p.nilai;
    }
    return { promo: p, diskon: hitungDiskon };
  }, [kodePromo, subtotal, promoList]);

  // Total Diskon & Total Bayar
  const diskonFinal = useMemo(() => {
    const baseDisc = appliedPromo ? appliedPromo.diskon : (Number(diskonManual) || 0);
    return baseDisc + diskonPoin;
  }, [appliedPromo, diskonManual, diskonPoin]);

  const totalBayar = useMemo(() => {
    return Math.max(0, subtotal - diskonFinal);
  }, [subtotal, diskonFinal]);

  const poinDiperolehEst = useMemo(() => {
    return Math.floor(totalBayar / 10000);
  }, [totalBayar]);

  // Derived Split Amounts
  const valJumlah1 = Number(splitJumlah1) || 0;
  const valJumlah2 = Math.max(0, totalBayar - valJumlah1);

  // Quick preset customer
  const fillWalkInCustomer = () => {
    setNama("Pelanggan Walk-in");
    setWa("080000000000");
  };

  // Handle Checkout
  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      setErr("Pilih minimal 1 perawatan / produk ke keranjang");
      return;
    }
    if (!nama.trim() || wa.trim().length < 9) {
      setErr("Isi Nama dan No. WA Pelanggan dengan benar");
      return;
    }

    if (paymentMode === "SPLIT") {
      if (valJumlah1 <= 0 || valJumlah1 >= totalBayar) {
        setErr("Nominal Metode 1 Split Payment harus di antara Rp 0 dan Total Bayar");
        return;
      }
    }

    setSubmitting(true);
    setErr("");

    try {
      const payloadItems = cart.map((c) => ({
        produkId: c.produk.id,
        karyawanId: c.karyawanId || null,
        qty: c.qty,
      }));

      const finalMetode = paymentMode === "SPLIT" ? "SPLIT" : metodeBayar;
      const splitDetails =
        paymentMode === "SPLIT"
          ? [
              { metode: splitMetode1, jumlah: valJumlah1 },
              { metode: splitMetode2, jumlah: valJumlah2 },
            ]
          : null;

      const res = await fetch("/api/cms/kasir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama: nama.trim(),
          wa: wa.trim(),
          items: payloadItems,
          promoKode: appliedPromo ? appliedPromo.promo.kode : null,
          diskonManual: appliedPromo ? appliedPromo.diskon : (Number(diskonManual) || 0),
          pakaiPoin: tukarPoinActive ? numPakaiPoin : 0,
          metodeBayar: finalMetode,
          splitDetails,
          isDp: paymentMode === "DP",
          dpAmount: paymentMode === "DP" ? Number(dpAmountInput) : 0,
        }),
      });

      const j = await res.json();
      setSubmitting(false);

      if (res.ok && j.bookingId) {
        router.push(`/cms/struk/${j.bookingId}`);
      } else {
        setErr(j.error ?? "Gagal memproses transaksi kasir");
      }
    } catch (err) {
      setSubmitting(false);
      console.error(err);
      setErr("Terjadi kesalahan koneksi kasir");
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-3">
        <RefreshCw size={28} className="animate-spin text-sage-600" />
        <p className="text-sm font-semibold text-stone-600">Memuat Sistem Kasir POS &amp; Katalog Salon...</p>
      </div>
    );
  }

  const totalCartCount = cart.reduce((acc, item) => acc + item.qty, 0);

  return (
    <div className="space-y-5">
      {/* Top POS Control Bar & Visual Metrics */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-stone-200/80 bg-white p-5 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h1 className="font-serif-display text-2xl font-bold text-stone-900">
              Kasir &amp; POS Checkout
            </h1>
            <span className="rounded-full bg-sage-100 px-3 py-0.5 text-xs font-bold text-sage-800 border border-sage-200">
              Edelweiss POS Live
            </span>
          </div>
          <p className="mt-1 text-xs text-stone-500">
            Katalog perawatan &amp; produk fisik interaktif. Mendukung multi-item cart, terapis dedicated, &amp; split payment.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Quick Global Therapist Selector */}
          <div className="flex items-center gap-2 rounded-2xl border border-stone-200 bg-stone-50/70 px-3 py-1.5 text-xs">
            <Scissors size={14} className="text-sage-700 shrink-0" />
            <span className="font-medium text-stone-500 hidden sm:inline">Terapis Default:</span>
            <select
              value={selectedKaryawanGlobal}
              onChange={(e) => setSelectedKaryawanGlobal(e.target.value)}
              className="bg-transparent font-bold text-stone-800 outline-none text-xs cursor-pointer"
            >
              <option value="">Pilih Terapis (Bebas)</option>
              {karyawanList.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.nama} ({k.jabatan})
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={loadData}
            className="flex items-center gap-1.5 rounded-2xl border border-stone-200 bg-white px-3.5 py-2 text-xs font-semibold text-stone-600 transition hover:bg-stone-50 hover:text-stone-900"
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* Main Layout Grid (2 Columns: Left Catalog 7 cols, Right Cart Drawer 5 cols) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        
        {/* LEFT COLUMN: Catalog Filter, Search & Product Grid/List (7 Cols) */}
        <div className="space-y-4 lg:col-span-7">
          
          {/* Search, Category Filter Chips & View Mode Switcher */}
          <div className="rounded-3xl border border-stone-200/80 bg-white p-4 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3.5 top-3 text-stone-400" />
                <input
                  type="text"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Cari perawatan salon / produk fisik..."
                  className="w-full rounded-2xl border border-stone-200 bg-stone-50/60 pl-10 pr-9 py-2.5 text-xs font-medium text-stone-900 transition focus:border-sage-600 focus:bg-white focus:outline-none"
                />
                {q && (
                  <button
                    type="button"
                    onClick={() => setQ("")}
                    className="absolute right-3 top-3 text-stone-400 hover:text-stone-700"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* View Switcher Toggle */}
              <div className="flex items-center rounded-2xl border border-stone-200 bg-stone-50 p-1">
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={`rounded-xl p-2 transition ${
                    viewMode === "grid" ? "bg-white text-sage-900 shadow-sm font-bold" : "text-stone-400 hover:text-stone-700"
                  }`}
                  title="Tampilan Kartu (Grid)"
                >
                  <LayoutGrid size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("table")}
                  className={`rounded-xl p-2 transition ${
                    viewMode === "table" ? "bg-white text-sage-900 shadow-sm font-bold" : "text-stone-400 hover:text-stone-700"
                  }`}
                  title="Tampilan Tabel (List)"
                >
                  <List size={16} />
                </button>
              </div>
            </div>

            {/* Category Filter Chips */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1 overflow-x-auto pb-1 no-scrollbar">
              <button
                type="button"
                onClick={() => setActiveKat("semua")}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                  activeKat === "semua"
                    ? "bg-sage-900 text-white shadow-md"
                    : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                }`}
              >
                Semua ({produkList.length})
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveKat(cat)}
                  className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                    activeKat === cat
                      ? "bg-sage-900 text-white shadow-md"
                      : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* GRID VIEW MODE */}
          {viewMode === "grid" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {filteredProducts.map((p) => {
                const cartItem = cart.find((item) => item.produk.id === p.id);
                const inCart = !!cartItem;
                const qtyInCart = cartItem?.qty || 0;

                return (
                  <div
                    key={p.id}
                    onClick={() => addToCart(p)}
                    className={`group relative flex flex-col justify-between rounded-3xl border p-4 transition-all cursor-pointer ${
                      inCart
                        ? "border-sage-600 bg-sage-50/60 shadow-md ring-2 ring-sage-600/20"
                        : "border-stone-200/80 bg-white hover:border-sage-400 hover:shadow-md"
                    }`}
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="rounded-full bg-gold-100 px-2.5 py-0.5 text-[10px] font-bold text-gold-700 border border-gold-200">
                          {p.kategori?.nama || "Umum"}
                        </span>
                        <span className="text-[11px] font-semibold text-stone-500">
                          {p.durasiMenit ? `⏱ ${p.durasiMenit} Mnt` : `📦 Stok: ${p.stok}`}
                        </span>
                      </div>

                      {/* Product Name */}
                      <h3 className="font-semibold text-stone-900 text-sm group-hover:text-sage-800 transition line-clamp-2">
                        {p.nama}
                      </h3>
                    </div>

                    {/* Bottom Price & Action Button */}
                    <div className="mt-4 flex items-end justify-between border-t border-stone-100 pt-3">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-stone-400 block">Harga</span>
                        <span className="font-serif-display text-base font-bold text-sage-900">
                          {rupiah(p.harga)}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart(p);
                        }}
                        className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                          inCart
                            ? "bg-sage-900 text-white shadow-sm hover:bg-sage-800"
                            : "bg-stone-100 text-stone-700 group-hover:bg-sage-700 group-hover:text-white"
                        }`}
                      >
                        {inCart ? (
                          <>
                            <CheckCircle size={14} className="text-gold-400" />
                            <span>(x{qtyInCart}) + Tambah</span>
                          </>
                        ) : (
                          <>
                            <Plus size={14} />
                            <span>Tambah</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TABLE VIEW MODE */}
          {viewMode === "table" && (
            <div className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 text-stone-500 border-b border-stone-200">
                  <tr>
                    <th className="px-4 py-3 font-semibold uppercase">Item</th>
                    <th className="px-4 py-3 font-semibold uppercase">Kategori</th>
                    <th className="px-4 py-3 font-semibold uppercase">Durasi / Stok</th>
                    <th className="px-4 py-3 font-semibold uppercase text-right">Harga</th>
                    <th className="px-4 py-3 font-semibold uppercase text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredProducts.map((p) => {
                    const cartItem = cart.find((item) => item.produk.id === p.id);
                    const inCart = !!cartItem;
                    return (
                      <tr
                        key={p.id}
                        onClick={() => addToCart(p)}
                        className={`cursor-pointer transition ${
                          inCart ? "bg-sage-50/90 font-medium text-sage-950" : "hover:bg-stone-50 text-stone-800"
                        }`}
                      >
                        <td className="px-4 py-3 font-bold text-stone-900">
                          <div className="flex items-center gap-2">
                            {inCart && <Check size={14} className="text-sage-700 font-bold shrink-0" />}
                            <span>{p.nama}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="rounded-full bg-gold-50 px-2 py-0.5 text-[10px] font-bold text-gold-700 border border-gold-200">
                            {p.kategori?.nama ?? "Layanan"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-stone-500">
                          {p.durasiMenit ? `⏱ ${p.durasiMenit} mnt` : `📦 Stok: ${p.stok}`}
                        </td>
                        <td className="px-4 py-3 text-right font-extrabold text-sage-900">{rupiah(p.harga)}</td>
                        <td className="px-4 py-3 text-center">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              addToCart(p);
                            }}
                            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                              inCart
                                ? "bg-sage-800 text-white shadow-sm"
                                : "border border-stone-200 bg-white text-stone-700 hover:bg-stone-100"
                            }`}
                          >
                            {inCart ? `(x${cartItem.qty}) +` : "+ Tambah"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {filteredProducts.length === 0 && (
            <div className="rounded-3xl border border-stone-200 bg-white p-8 text-center text-xs text-stone-400">
              Tidak ada item yang cocok dengan kata kunci &quot;{q}&quot;
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Order Cart & POS Checkout Drawer (5 Cols) */}
        <div className="lg:col-span-5">
          <form
            onSubmit={handleCheckout}
            className="sticky top-20 rounded-3xl border border-stone-200/90 bg-white p-5 shadow-xl space-y-5"
          >
            {/* Cart Drawer Header */}
            <div className="flex items-center justify-between border-b border-stone-100 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="rounded-2xl bg-sage-100 p-2 text-sage-800">
                  <ShoppingCart size={18} />
                </div>
                <div>
                  <h2 className="font-bold text-stone-900 text-base">Keranjang Belanja</h2>
                  <p className="text-[11px] text-stone-400">{totalCartCount} total barang/layanan</p>
                </div>
              </div>

              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={() => setCart([])}
                  className="flex items-center gap-1 text-[11px] font-semibold text-rose-600 hover:text-rose-800 transition"
                  title="Kosongkan Keranjang"
                >
                  <Trash2 size={13} /> Reset
                </button>
              )}
            </div>

            {err && (
              <div className="rounded-2xl bg-red-50 p-3 text-xs font-semibold text-red-700 border border-red-200/80 animate-in fade-in">
                ⚠️ {err}
              </div>
            )}

            {/* CART ITEMS LIST */}
            {cart.length > 0 ? (
              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {cart.map((item) => (
                  <div
                    key={item.produk.id}
                    className="rounded-2xl border border-stone-200/90 bg-stone-50/80 p-3 text-xs space-y-2.5 transition hover:bg-stone-50"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="font-bold text-stone-900 text-xs">{item.produk.nama}</p>
                        <p className="text-[11px] text-stone-500 font-medium">{rupiah(item.produk.harga)} / item</p>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Quantity Stepper */}
                        <div className="flex items-center border border-stone-300 rounded-xl bg-white overflow-hidden shadow-sm">
                          <button
                            type="button"
                            onClick={() => updateQty(item.produk.id, -1)}
                            className="px-2 py-1 font-bold text-stone-600 hover:bg-stone-100 transition"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="px-2.5 font-extrabold text-stone-900 text-xs">{item.qty}</span>
                          <button
                            type="button"
                            onClick={() => updateQty(item.produk.id, 1)}
                            className="px-2 py-1 font-bold text-stone-600 hover:bg-stone-100 transition"
                          >
                            <Plus size={12} />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeFromCart(item.produk.id)}
                          className="rounded-lg p-1 text-stone-400 hover:bg-rose-50 hover:text-rose-600 transition"
                          title="Hapus item"
                        >
                          <X size={15} />
                        </button>
                      </div>
                    </div>

                    {/* Therapist Select & Line Total */}
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-stone-200/60">
                      <div className="flex items-center gap-1.5 flex-1">
                        <Scissors size={12} className="text-sage-700 shrink-0" />
                        <select
                          value={item.karyawanId}
                          onChange={(e) => updateItemTherapist(item.produk.id, e.target.value)}
                          className="w-full rounded-xl border border-stone-200 bg-white px-2 py-1 text-[11px] font-medium text-stone-800 outline-none focus:border-sage-600"
                        >
                          <option value="">Terapis Bebas / No Pref</option>
                          {karyawanList.map((k) => (
                            <option key={k.id} value={k.id}>
                              {k.nama} ({k.jabatan})
                            </option>
                          ))}
                        </select>
                      </div>

                      <span className="font-extrabold text-sage-900 text-xs shrink-0">
                        {rupiah(item.produk.harga * item.qty)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-amber-300 bg-amber-50/70 p-5 text-center text-xs text-amber-800 font-medium space-y-1">
                <ShoppingCart size={24} className="mx-auto text-amber-600 opacity-80 mb-1" />
                <p className="font-bold">Keranjang masih kosong</p>
                <p className="text-[11px] text-amber-700">Pilih perawatan atau produk dari katalog di sebelah kiri.</p>
              </div>
            )}

            {/* CUSTOMER INFORMATION */}
            <div className="space-y-3 pt-2 border-t border-stone-100">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-1 text-xs font-bold text-stone-800">
                  <User size={13} className="text-sage-700" /> Pelanggan *
                </Label>
                <button
                  type="button"
                  onClick={fillWalkInCustomer}
                  className="text-[10px] font-bold text-sage-700 hover:text-sage-900 bg-sage-50 px-2 py-0.5 rounded-lg border border-sage-200"
                >
                  + Quick Walk-in
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="text"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  placeholder="Nama Pelanggan"
                  className="text-xs rounded-xl"
                  required
                />
                <Input
                  type="tel"
                  value={wa}
                  onChange={(e) => setWa(e.target.value)}
                  placeholder="No. WhatsApp"
                  className="text-xs rounded-xl"
                  required
                />
              </div>
            </div>

            {/* LOYALTY POINTS CARD */}
            {foundPelanggan && (
              <div className="rounded-2xl border border-gold-200 bg-gold-50/70 p-3 space-y-2 text-xs">
                <div className="flex items-center justify-between font-bold text-gold-900">
                  <span className="flex items-center gap-1">
                    <Sparkles size={14} className="text-gold-500" /> Member Loyalitas
                  </span>
                  <span className="rounded-full bg-gold-200/80 px-2.5 py-0.5 text-[11px] font-extrabold text-gold-950">
                    ⭐ {foundPelanggan.poin} Poin
                  </span>
                </div>

                {foundPelanggan.poin > 0 ? (
                  <div className="space-y-2 pt-1 border-t border-gold-200/60">
                    <label className="flex items-center gap-2 cursor-pointer font-semibold text-gold-900">
                      <input
                        type="checkbox"
                        checked={tukarPoinActive}
                        onChange={(e) => {
                          setTukarPoinActive(e.target.checked);
                          if (e.target.checked && (!pakaiPoinInput || pakaiPoinInput === "0")) {
                            setPakaiPoinInput(String(foundPelanggan.poin));
                          }
                        }}
                        className="rounded border-gold-400 text-gold-600 focus:ring-gold-500"
                      />
                      <span>Tukarkan Poin untuk Potongan Harga</span>
                    </label>

                    {tukarPoinActive && (
                      <div className="flex items-center gap-2 pt-1">
                        <Input
                          type="number"
                          value={pakaiPoinInput}
                          onChange={(e) => setPakaiPoinInput(e.target.value)}
                          placeholder="Jumlah Poin"
                          className="w-24 text-xs font-bold rounded-xl border-gold-300 bg-white"
                        />
                        <span className="text-[11px] font-bold text-emerald-700">
                          = Diskon −{rupiah(diskonPoin)}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-[11px] text-gold-700">
                    Transaksi ini akan memperoleh estimasi <b>+{poinDiperolehEst} Poin Loyalitas</b>.
                  </p>
                )}
              </div>
            )}

            {/* PAYMENT SCHEMA SELECTOR (Single / Split / DP) */}
            <div className="space-y-2.5 pt-2 border-t border-stone-100">
              <Label className="flex items-center gap-1 text-xs font-bold text-stone-800">
                <CreditCard size={13} className="text-sage-700" /> Skema Pembayaran
              </Label>

              <div className="grid grid-cols-3 gap-1.5 rounded-2xl bg-stone-100 p-1">
                <button
                  type="button"
                  onClick={() => setPaymentMode("SINGLE")}
                  className={`rounded-xl py-2 text-[11px] font-bold transition ${
                    paymentMode === "SINGLE"
                      ? "bg-white text-sage-900 shadow-sm"
                      : "text-stone-500 hover:text-stone-800"
                  }`}
                >
                  💳 Penuh (1 Cara)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPaymentMode("SPLIT");
                    if (!splitJumlah1 || Number(splitJumlah1) === 0) {
                      setSplitJumlah1(String(Math.round(totalBayar / 2)));
                    }
                  }}
                  className={`rounded-xl py-2 text-[11px] font-bold transition ${
                    paymentMode === "SPLIT"
                      ? "bg-white text-sage-900 shadow-sm"
                      : "text-stone-500 hover:text-stone-800"
                  }`}
                >
                  🔀 Split Payment
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMode("DP")}
                  className={`rounded-xl py-2 text-[11px] font-bold transition ${
                    paymentMode === "DP"
                      ? "bg-white text-sage-900 shadow-sm"
                      : "text-stone-500 hover:text-stone-800"
                  }`}
                >
                  💵 DP (Uang Muka)
                </button>
              </div>

              {/* SINGLE PAYMENT METHOD BUTTONS */}
              {paymentMode === "SINGLE" && (
                <div className="grid grid-cols-4 gap-1.5 pt-1">
                  {(["TUNAI", "TRANSFER", "QRIS", "DEBIT"] as const).map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setMetodeBayar(method)}
                      className={`rounded-xl py-2 text-xs font-bold border transition ${
                        metodeBayar === method
                          ? "border-sage-700 bg-sage-800 text-white shadow-md"
                          : "border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100"
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              )}

              {/* SPLIT PAYMENT CONTROLS */}
              {paymentMode === "SPLIT" && (
                <div className="space-y-2.5 rounded-2xl border border-sage-200 bg-sage-50/60 p-3.5 text-xs">
                  <div className="flex items-center justify-between font-bold text-sage-900 text-[11px]">
                    <span>Rincian Pembagian Split:</span>
                    <span>Total: {rupiah(totalBayar)}</span>
                  </div>

                  {/* Preset Buttons */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-semibold text-stone-500">Quick Preset:</span>
                    <button
                      type="button"
                      onClick={() => setSplitJumlah1(String(Math.round(totalBayar / 2)))}
                      className="rounded-lg bg-white px-2 py-0.5 text-[10px] font-bold text-sage-800 border border-sage-200 hover:bg-sage-100 transition"
                    >
                      50% - 50%
                    </button>
                    <button
                      type="button"
                      onClick={() => setSplitJumlah1(String(Math.round((totalBayar * 70) / 100)))}
                      className="rounded-lg bg-white px-2 py-0.5 text-[10px] font-bold text-sage-800 border border-sage-200 hover:bg-sage-100 transition"
                    >
                      70% - 30%
                    </button>
                  </div>

                  {/* Split 1 */}
                  <div className="flex items-center gap-2">
                    <select
                      value={splitMetode1}
                      onChange={(e) => setSplitMetode1(e.target.value as "TUNAI" | "TRANSFER" | "QRIS" | "DEBIT")}
                      className="rounded-xl border border-stone-300 bg-white px-2 py-1.5 font-bold text-stone-800 outline-none text-xs"
                    >
                      <option value="TUNAI">TUNAI</option>
                      <option value="TRANSFER">TRANSFER</option>
                      <option value="QRIS">QRIS</option>
                      <option value="DEBIT">DEBIT</option>
                    </select>
                    <Input
                      type="number"
                      value={splitJumlah1}
                      onChange={(e) => setSplitJumlah1(e.target.value)}
                      placeholder="Nominal 1"
                      className="text-xs font-bold rounded-xl"
                    />
                  </div>

                  {/* Split 2 (Auto computed) */}
                  <div className="flex items-center gap-2">
                    <select
                      value={splitMetode2}
                      onChange={(e) => setSplitMetode2(e.target.value as "TUNAI" | "TRANSFER" | "QRIS" | "DEBIT")}
                      className="rounded-xl border border-stone-300 bg-white px-2 py-1.5 font-bold text-stone-800 outline-none text-xs"
                    >
                      <option value="QRIS">QRIS</option>
                      <option value="TRANSFER">TRANSFER</option>
                      <option value="TUNAI">TUNAI</option>
                      <option value="DEBIT">DEBIT</option>
                    </select>
                    <div className="w-full rounded-xl border border-stone-300 bg-stone-100 px-3 py-1.5 font-extrabold text-stone-800 text-xs">
                      {rupiah(valJumlah2)} (Sisa)
                    </div>
                  </div>

                  <div className="text-[11px] text-emerald-800 font-semibold bg-emerald-100/70 p-2 rounded-xl border border-emerald-300 text-center">
                    ✓ {splitMetode1} ({rupiah(valJumlah1)}) + {splitMetode2} ({rupiah(valJumlah2)}) = {rupiah(totalBayar)}
                  </div>
                </div>
              )}

              {/* DP PAYMENT CONTROLS */}
              {paymentMode === "DP" && (
                <div className="space-y-2.5 rounded-2xl border border-amber-200 bg-amber-50/60 p-3.5 text-xs">
                  <div className="grid grid-cols-4 gap-1.5 mb-1">
                    {(["TUNAI", "TRANSFER", "QRIS", "DEBIT"] as const).map((method) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setMetodeBayar(method)}
                        className={`rounded-xl py-1.5 text-[11px] font-bold border transition ${
                          metodeBayar === method
                            ? "border-amber-600 bg-amber-700 text-white shadow-sm"
                            : "border-stone-200 bg-white text-stone-700 hover:bg-stone-100"
                        }`}
                      >
                        {method}
                      </button>
                    ))}
                  </div>

                  <div>
                    <Label className="text-[11px] font-bold">Nominal DP Masuk (Rp):</Label>
                    <Input
                      type="number"
                      value={dpAmountInput}
                      onChange={(e) => setDpAmountInput(e.target.value)}
                      placeholder="Nominal DP"
                      className="text-xs font-bold rounded-xl"
                    />
                  </div>

                  <div className="flex justify-between items-center pt-1 font-semibold text-amber-900 text-[11px]">
                    <span>Sisa Pelunasan Nanti:</span>
                    <span className="font-extrabold text-rose-700 text-xs">
                      {rupiah(Math.max(0, totalBayar - (Number(dpAmountInput) || 0)))}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* PROMO CODE & DISCOUNT SECTION */}
            <div className="space-y-2 pt-2 border-t border-stone-100">
              <Label className="flex items-center gap-1 text-xs font-bold text-stone-800">
                <TicketPercent size={13} className="text-gold-500" /> Promo &amp; Diskon (Opsional)
              </Label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={kodePromo}
                  onChange={(e) => setKodePromo(e.target.value.toUpperCase())}
                  placeholder="Kode Promo (cth: EWS10)"
                  className="uppercase font-mono text-xs rounded-xl"
                />
              </div>

              {!appliedPromo && (
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-xs text-stone-400 shrink-0">Atau Potongan Rp:</span>
                  <Input
                    type="number"
                    value={diskonManual}
                    onChange={(e) => setDiskonManual(e.target.value)}
                    placeholder="Diskon Nominal"
                    className="w-full text-xs rounded-xl"
                  />
                </div>
              )}

              {appliedPromo && (
                <div className="flex items-center justify-between text-xs text-emerald-800 font-bold bg-emerald-100/70 p-2.5 rounded-xl border border-emerald-300">
                  <span>🎟 Promo {appliedPromo.promo.kode} Aktif</span>
                  <span>−{rupiah(appliedPromo.diskon)}</span>
                </div>
              )}
            </div>

            {/* CALCULATION SUMMARY CARD */}
            <div className="rounded-2xl bg-stone-50 p-3.5 border border-stone-200/80 space-y-2 text-xs">
              <div className="flex justify-between text-stone-500 font-medium">
                <span>Subtotal ({totalCartCount} item)</span>
                <span>{rupiah(subtotal)}</span>
              </div>
              {diskonFinal > 0 && (
                <div className="flex justify-between text-rose-600 font-bold">
                  <span>Total Potongan</span>
                  <span>−{rupiah(diskonFinal)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-stone-200/80 pt-2 text-base font-extrabold text-sage-950">
                <span>TOTAL BAYAR</span>
                <span className="text-sage-800 text-lg font-serif-display">{rupiah(totalBayar)}</span>
              </div>
            </div>

            {/* SUBMIT CHECKOUT BUTTON */}
            <button
              type="submit"
              disabled={submitting || cart.length === 0}
              className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-sage-900 py-3.5 text-xs font-bold text-white shadow-xl transition hover:bg-sage-800 active:scale-[0.99] disabled:opacity-50"
            >
              {submitting ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <Sparkles size={16} className="text-gold-400 group-hover:rotate-12 transition" />
                  Selesaikan Transaksi &amp; Cetak Struk <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
