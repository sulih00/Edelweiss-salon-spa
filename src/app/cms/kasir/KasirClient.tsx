"use client";

import React, { useEffect, useState, useMemo, useCallback, useDeferredValue, useRef, memo } from "react";
import { useRouter } from "next/navigation";
import { Input, Label, useAlert } from "@/components/ui";
import { rupiah } from "@/lib/utils";
import {
  Search, ShoppingCart, User, Scissors, Calendar,
  CreditCard, TicketPercent, ArrowRight, RefreshCw, Sparkles, Plus, Minus, Trash2, X, Check, Command, BookOpen
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

interface BookingActive {
  id: string;
  jadwal: string;
  status: string;
  nominalTF?: number | null;
  buktiTF?: string | null;
  pelanggan: { nama: string; wa: string };
  produk: Produk;
  karyawan?: { id: string; nama: string } | null;
}

type CartItem = { produk: Produk; karyawanId: string; qty: number };

// --- MEMOIZED CART ITEM ROW ---
const CartItemRow = memo(function CartItemRow({
  item,
  karyawanList,
  onUpdateQty,
  onRemoveFromCart,
  onUpdateItemTherapist,
}: {
  item: CartItem;
  karyawanList: Karyawan[];
  onUpdateQty: (produkId: string, delta: number) => void;
  onRemoveFromCart: (produkId: string) => void;
  onUpdateItemTherapist: (produkId: string, karyawanId: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-stone-200/90 bg-stone-50/80 p-3.5 text-xs space-y-2.5 transition hover:bg-stone-50 shadow-xs">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-stone-900 text-xs">{item.produk.nama}</span>
            <span className="rounded-full bg-gold-50 px-2 py-0.5 text-[9px] font-bold text-gold-700 border border-gold-200">
              {item.produk.kategori?.nama ?? "Layanan"}
            </span>
          </div>
          <p className="text-[11px] text-stone-500 font-medium mt-0.5">
            {rupiah(item.produk.harga)} {item.produk.durasiMenit ? `• ⏱ ${item.produk.durasiMenit} mnt` : `• Stok: ${item.produk.stok}`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center border border-stone-300 rounded-xl bg-white overflow-hidden shadow-xs">
            <button
              type="button"
              onClick={() => onUpdateQty(item.produk.id, -1)}
              className="px-2 py-1 font-bold text-stone-600 hover:bg-stone-100 transition cursor-pointer"
            >
              <Minus size={12} />
            </button>
            <span className="px-2.5 font-extrabold text-stone-900 text-xs">{item.qty}</span>
            <button
              type="button"
              onClick={() => onUpdateQty(item.produk.id, 1)}
              className="px-2 py-1 font-bold text-stone-600 hover:bg-stone-100 transition cursor-pointer"
            >
              <Plus size={12} />
            </button>
          </div>

          <button
            type="button"
            onClick={() => onRemoveFromCart(item.produk.id)}
            className="rounded-lg p-1.5 text-stone-400 hover:bg-rose-50 hover:text-rose-600 transition cursor-pointer"
            title="Hapus item"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 pt-2 border-t border-stone-200/60">
        <div className="flex items-center gap-1.5 flex-1">
          <Scissors size={12} className="text-sage-700 shrink-0" />
          <select
            value={item.karyawanId}
            onChange={(e) => onUpdateItemTherapist(item.produk.id, e.target.value)}
            className="w-full rounded-xl border border-stone-200 bg-white px-2 py-1 text-[11px] font-medium text-stone-800 outline-none focus:border-sage-600 cursor-pointer"
          >
            <option value="">Terapis Bebas / Tanpa Preferensi</option>
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
  );
});

export default function KasirClient() {
  const router = useRouter();
  const { toast } = useAlert();

  const searchInputRef = useRef<HTMLInputElement>(null);

  const [produkList, setProdukList] = useState<Produk[]>([]);
  const [karyawanList, setKaryawanList] = useState<Karyawan[]>([]);
  const [promoList, setPromoList] = useState<Promo[]>([]);
  const [pelangganList, setPelangganList] = useState<PelangganSummary[]>([]);
  const [bookingList, setBookingList] = useState<BookingActive[]>([]);
  const [loading, setLoading] = useState(true);

  // Search State & Autocomplete Focus
  const [q, setQ] = useState("");
  const deferredQ = useDeferredValue(q);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showCatalogModal, setShowCatalogModal] = useState(false);

  // Cart State (Multi-Item Support)
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

  // Load POS data
  const loadData = useCallback(async () => {
    try {
      const res = await fetch("/api/cms/kasir");
      if (res.ok) {
        const j = await res.json();
        setProdukList(j.produk ?? []);
        setKaryawanList(j.karyawan ?? []);
        setPromoList(j.promo ?? []);
        setPelangganList(j.pelanggan ?? []);
        setBookingList(j.bookingList ?? []);
      }
    } catch (e) {
      console.error("Gagal load data POS:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    fetch("/api/cms/kasir")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (!ignore && j) {
          setProdukList(j.produk ?? []);
          setKaryawanList(j.karyawan ?? []);
          setPromoList(j.promo ?? []);
          setPelangganList(j.pelanggan ?? []);
          setBookingList(j.bookingList ?? []);
          setLoading(false);
        }
      })
      .catch((e) => {
        if (!ignore) {
          console.error("Gagal load data POS:", e);
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  // Global Keyboard Shortcut: '/' or 'Ctrl+K' focuses search input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === "/" || (e.ctrlKey && e.key === "k")) && document.activeElement !== searchInputRef.current) {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Import online booking
  const importBooking = useCallback(
    (b: BookingActive) => {
      setNama(b.pelanggan.nama);
      setWa(b.pelanggan.wa);
      if (b.produk) {
        setCart([{ produk: b.produk, karyawanId: b.karyawan?.id ?? "", qty: 1 }]);
      }
      const nominal = b.nominalTF ?? 0;
      if (nominal > 0 || b.buktiTF) {
        setPaymentMode("DP");
        setDpAmountInput(String(nominal || 50000));
        setMetodeBayar("DEBIT");
        toast.success(
          `Booking ${b.pelanggan.nama} diimpor! DP ${nominal > 0 ? rupiah(nominal) : ""} dicatat sebagai DEBIT.`,
          "Impor Booking",
          3500
        );
      } else {
        toast.info(`Booking ${b.pelanggan.nama} diimpor ke kasir.`, "Impor Booking", 2000);
      }
    },
    [toast]
  );

  // Cart Helper Handlers (Memoized)
  const addToCart = useCallback(
    (p: Produk) => {
      setCart((prev) => {
        const idx = prev.findIndex((item) => item.produk.id === p.id);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = { ...updated[idx], qty: updated[idx].qty + 1 };
          return updated;
        }
        return [...prev, { produk: p, karyawanId: selectedKaryawanGlobal, qty: 1 }];
      });
      toast.success(`${p.nama} ditambahkan`, "Keranjang", 1200);
    },
    [selectedKaryawanGlobal, toast]
  );

  const removeFromCart = useCallback((produkId: string) => {
    setCart((prev) => prev.filter((item) => item.produk.id !== produkId));
  }, []);

  const updateQty = useCallback((produkId: string, delta: number) => {
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
  }, []);

  const updateItemTherapist = useCallback((produkId: string, karyawanId: string) => {
    setCart((prev) =>
      prev.map((item) => (item.produk.id === produkId ? { ...item, karyawanId } : item))
    );
  }, []);

  // Cart quantity map
  const cartMap = useMemo(() => {
    const map = new Map<string, number>();
    cart.forEach((item) => map.set(item.produk.id, item.qty));
    return map;
  }, [cart]);

  // Non-blocking Filtered Products for Search Autocomplete
  const searchResults = useMemo(() => {
    const query = deferredQ.toLowerCase().trim();
    if (!query) return [];
    return produkList
      .filter((p) => {
        return (
          p.nama.toLowerCase().includes(query) ||
          (p.kategori?.nama && p.kategori.nama.toLowerCase().includes(query))
        );
      })
      .slice(0, 10); // Limit to top 10 matches for fast response
  }, [produkList, deferredQ]);

  // Top Popular Services for Quick Add Chips
  const popularServices = useMemo(() => {
    return produkList.slice(0, 6);
  }, [produkList]);

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

  // Handle Search Input Enter Press
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (searchResults.length > 0) {
        addToCart(searchResults[0]);
        setQ("");
      }
    }
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
        toast.success("Transaksi kasir berhasil!", "Berhasil");
        router.push(`/cms/struk/${j.bookingId}`);
      } else {
        const errorMsg = j.error ?? "Gagal memproses transaksi kasir";
        setErr(errorMsg);
        toast.error(errorMsg);
      }
    } catch (err) {
      setSubmitting(false);
      console.error(err);
      const connErr = "Terjadi kesalahan koneksi kasir";
      setErr(connErr);
      toast.error(connErr);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-3">
        <RefreshCw size={28} className="animate-spin text-sage-600" />
        <p className="text-sm font-semibold text-stone-600">Memuat POS Kasir Edelweiss...</p>
      </div>
    );
  }

  const totalCartCount = cart.reduce((acc, item) => acc + item.qty, 0);

  return (
    <div className="space-y-5">
      {/* Top Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-stone-200/80 bg-white p-5 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h1 className="font-serif-display text-2xl font-bold text-stone-900">
              Kasir POS Transaksi
            </h1>
            <span className="rounded-full bg-sage-100 px-3 py-0.5 text-xs font-bold text-sage-800 border border-sage-200">
              Production Ready
            </span>
          </div>
          <p className="mt-1 text-xs text-stone-500">
            Pencarian instan produk &amp; perawatan salon. Tekan <kbd className="rounded bg-stone-100 px-1.5 py-0.5 font-mono text-[10px] border border-stone-300 font-bold">/</kbd> untuk cari cepat.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Global Therapist Selector */}
          <div className="flex items-center gap-2 rounded-2xl border border-stone-200 bg-stone-50/70 px-3 py-1.5 text-xs">
            <Scissors size={14} className="text-sage-700 shrink-0" />
            <span className="font-medium text-stone-500 hidden sm:inline">Terapis Default:</span>
            <select
              value={selectedKaryawanGlobal}
              onChange={(e) => setSelectedKaryawanGlobal(e.target.value)}
              className="bg-transparent font-bold text-stone-800 outline-none text-xs cursor-pointer"
            >
              <option value="">Terapis Bebas / No Pref</option>
              {karyawanList.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.nama} ({k.jabatan})
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => setShowCatalogModal(true)}
            className="flex items-center gap-1.5 rounded-2xl border border-stone-200 bg-white px-3.5 py-2 text-xs font-semibold text-stone-700 transition hover:bg-stone-50 cursor-pointer"
          >
            <BookOpen size={14} className="text-sage-700" /> Katalog Lengkap
          </button>

          <button
            type="button"
            onClick={loadData}
            className="flex items-center gap-1.5 rounded-2xl border border-stone-200 bg-white px-3.5 py-2 text-xs font-semibold text-stone-600 transition hover:bg-stone-50 cursor-pointer"
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        
        {/* LEFT COLUMN: Search & Quick Add Section (7 Cols) */}
        <div className="space-y-5 lg:col-span-7">
          
          {/* SEARCH-ONLY AUTOCOMPLETE COMPONENT */}
          <div className="relative rounded-3xl border border-sage-200 bg-white p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-sage-900 flex items-center gap-1.5">
                <Search size={15} className="text-sage-700" /> Cari Perawatan / Produk Salon
              </label>
              <span className="text-[11px] text-stone-400 flex items-center gap-1">
                <Command size={12} /> Tekan <b>/</b>
              </span>
            </div>

            <div className="relative">
              <Search size={18} className="absolute left-4 top-3.5 text-sage-600" />
              <input
                ref={searchInputRef}
                type="text"
                value={q}
                onFocus={() => setIsSearchFocused(true)}
                onChange={(e) => {
                  setQ(e.target.value);
                  setIsSearchFocused(true);
                }}
                onKeyDown={handleSearchKeyDown}
                placeholder="Ketik nama perawatan (cth: Cut, Creambath, Facial, Nail)..."
                className="w-full rounded-2xl border-2 border-sage-300 bg-stone-50/50 pl-11 pr-10 py-3 text-sm font-semibold text-stone-900 transition focus:border-sage-700 focus:bg-white focus:outline-none shadow-xs"
              />
              {q && (
                <button
                  type="button"
                  onClick={() => setQ("")}
                  className="absolute right-3.5 top-3.5 text-stone-400 hover:text-stone-700 cursor-pointer"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* INSTANT SEARCH AUTOCOMPLETE DROPDOWN */}
            {isSearchFocused && q.trim().length > 0 && (
              <div className="rounded-2xl border border-stone-200 bg-white shadow-xl overflow-hidden max-h-80 overflow-y-auto divide-y divide-stone-100 animate-in fade-in slide-in-from-top-2 duration-150">
                {searchResults.length > 0 ? (
                  searchResults.map((p, idx) => {
                    const qtyInCart = cartMap.get(p.id) || 0;
                    return (
                      <div
                        key={p.id}
                        onClick={() => {
                          addToCart(p);
                          setQ("");
                          setIsSearchFocused(false);
                        }}
                        className={`flex items-center justify-between p-3.5 transition cursor-pointer ${
                          idx === 0 ? "bg-sage-50/60" : "hover:bg-stone-50"
                        }`}
                      >
                        <div className="flex-1 pr-3">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-stone-900 text-xs">{p.nama}</span>
                            <span className="rounded-full bg-gold-50 px-2 py-0.5 text-[9px] font-bold text-gold-700 border border-gold-200">
                              {p.kategori?.nama ?? "Umum"}
                            </span>
                          </div>
                          <p className="text-[11px] text-stone-500 mt-0.5">
                            {p.durasiMenit ? `⏱ ${p.durasiMenit} menit` : `📦 Stok: ${p.stok}`}
                          </p>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <span className="font-serif-display font-extrabold text-sage-900 text-sm">
                            {rupiah(p.harga)}
                          </span>
                          <button
                            type="button"
                            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition flex items-center gap-1 ${
                              qtyInCart > 0
                                ? "bg-sage-900 text-white shadow-xs"
                                : "bg-sage-700 text-white hover:bg-sage-800"
                            }`}
                          >
                            {qtyInCart > 0 ? (
                              <>
                                <Check size={13} /> (x{qtyInCart}) +
                              </>
                            ) : (
                              <>
                                <Plus size={13} /> Tambah
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-6 text-center text-xs text-stone-400 font-medium">
                    Tidak ada perawatan/produk yang cocok dengan &quot;{q}&quot;
                  </div>
                )}
              </div>
            )}

            {/* QUICK FAVORITE SERVICES CHIPS */}
            <div className="pt-2 border-t border-stone-100">
              <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block mb-2">
                ⚡ Akses Cepat Perawatan Populer:
              </span>
              <div className="flex flex-wrap gap-2">
                {popularServices.map((p) => {
                  const qtyInCart = cartMap.get(p.id) || 0;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => addToCart(p)}
                      className={`flex items-center gap-1.5 rounded-2xl border px-3 py-2 text-xs font-semibold transition cursor-pointer ${
                        qtyInCart > 0
                          ? "border-sage-600 bg-sage-100 text-sage-950 font-bold shadow-xs"
                          : "border-stone-200 bg-stone-50/80 text-stone-700 hover:border-sage-400 hover:bg-white"
                      }`}
                    >
                      <span>{p.nama}</span>
                      <span className="font-bold text-sage-900">({rupiah(p.harga)})</span>
                      {qtyInCart > 0 && (
                        <span className="ml-1 rounded-full bg-sage-800 text-white px-1.5 py-0.2 text-[10px] font-extrabold">
                          x{qtyInCart}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ACTIVE CART ITEMS DISPLAY TABLE / LIST */}
          <div className="rounded-3xl border border-stone-200/80 bg-white p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <ShoppingCart size={18} className="text-sage-700" />
                <h2 className="font-bold text-stone-900 text-base">Item Dalam Keranjang ({cart.length})</h2>
              </div>
              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={() => setCart([])}
                  className="flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-800 transition cursor-pointer"
                >
                  <Trash2 size={13} /> Kosongkan Keranjang
                </button>
              )}
            </div>

            {cart.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {cart.map((item) => (
                  <CartItemRow
                    key={item.produk.id}
                    item={item}
                    karyawanList={karyawanList}
                    onUpdateQty={updateQty}
                    onRemoveFromCart={removeFromCart}
                    onUpdateItemTherapist={updateItemTherapist}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-stone-200 bg-stone-50/60 p-8 text-center text-xs text-stone-400 font-medium space-y-2">
                <Search size={28} className="mx-auto text-stone-300" />
                <p className="font-bold text-stone-600">Keranjang masih kosong</p>
                <p className="text-[11px] text-stone-400">
                  Gunakan kolom pencarian di atas atau tombol akses cepat untuk memasukkan perawatan.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Customer Details, Discounts & Checkout Drawer (5 Cols) */}
        <div className="lg:col-span-5">
          <form
            onSubmit={handleCheckout}
            className="sticky top-20 rounded-3xl border border-stone-200/90 bg-white p-5 shadow-xl space-y-5"
          >
            {/* Drawer Title */}
            <div className="flex items-center justify-between border-b border-stone-100 pb-3.5">
              <div>
                <h2 className="font-bold text-stone-900 text-base">Rincian Pelanggan &amp; Pembayaran</h2>
                <p className="text-[11px] text-stone-400">{totalCartCount} item terpilih</p>
              </div>
              <span className="rounded-full bg-gold-100 px-3 py-1 text-xs font-bold text-gold-800 border border-gold-200">
                POS Kasir
              </span>
            </div>

            {err && (
              <div className="rounded-2xl bg-red-50 p-3 text-xs font-semibold text-red-700 border border-red-200/80 animate-in fade-in">
                ⚠️ {err}
              </div>
            )}

            {/* ONLINE BOOKING IMPORT */}
            {bookingList.length > 0 && (
              <div className="rounded-2xl border border-sage-200 bg-sage-50/80 p-3 text-xs space-y-1.5">
                <div className="flex items-center justify-between font-bold text-sage-900">
                  <span className="flex items-center gap-1.5">
                    <Calendar size={14} className="text-sage-700" /> Impor Booking Online ({bookingList.length})
                  </span>
                </div>
                <select
                  onChange={(e) => {
                    const b = bookingList.find((item) => item.id === e.target.value);
                    if (b) importBooking(b);
                  }}
                  className="w-full rounded-xl border border-sage-300 bg-white p-2 font-medium text-stone-800 outline-none text-xs cursor-pointer"
                  defaultValue=""
                >
                  <option value="" disabled>-- Pilih Booking Online untuk Diproses --</option>
                  {bookingList.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.pelanggan.nama} - {b.produk.nama} {b.nominalTF ? `(DP DEBIT ${rupiah(b.nominalTF)})` : b.buktiTF ? "(Ada Bukti TF)" : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* CUSTOMER INFORMATION */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-1 text-xs font-bold text-stone-800">
                  <User size={13} className="text-sage-700" /> Pelanggan *
                </Label>
                <button
                  type="button"
                  onClick={fillWalkInCustomer}
                  className="text-[10px] font-bold text-sage-700 hover:text-sage-900 bg-sage-50 px-2 py-0.5 rounded-lg border border-sage-200 cursor-pointer"
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
                        className="rounded border-gold-400 text-gold-600 focus:ring-gold-500 cursor-pointer"
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
                  className={`rounded-xl py-2 text-[11px] font-bold transition cursor-pointer ${
                    paymentMode === "SINGLE"
                      ? "bg-white text-sage-900 shadow-xs"
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
                  className={`rounded-xl py-2 text-[11px] font-bold transition cursor-pointer ${
                    paymentMode === "SPLIT"
                      ? "bg-white text-sage-900 shadow-xs"
                      : "text-stone-500 hover:text-stone-800"
                  }`}
                >
                  🔀 Split Payment
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMode("DP")}
                  className={`rounded-xl py-2 text-[11px] font-bold transition cursor-pointer ${
                    paymentMode === "DP"
                      ? "bg-white text-sage-900 shadow-xs"
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
                      className={`rounded-xl py-2 text-xs font-bold border transition cursor-pointer ${
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
                      className="rounded-lg bg-white px-2 py-0.5 text-[10px] font-bold text-sage-800 border border-sage-200 hover:bg-sage-100 transition cursor-pointer"
                    >
                      50% - 50%
                    </button>
                    <button
                      type="button"
                      onClick={() => setSplitJumlah1(String(Math.round((totalBayar * 70) / 100)))}
                      className="rounded-lg bg-white px-2 py-0.5 text-[10px] font-bold text-sage-800 border border-sage-200 hover:bg-sage-100 transition cursor-pointer"
                    >
                      70% - 30%
                    </button>
                  </div>

                  {/* Split 1 */}
                  <div className="flex items-center gap-2">
                    <select
                      value={splitMetode1}
                      onChange={(e) => setSplitMetode1(e.target.value as "TUNAI" | "TRANSFER" | "QRIS" | "DEBIT")}
                      className="rounded-xl border border-stone-300 bg-white px-2 py-1.5 font-bold text-stone-800 outline-none text-xs cursor-pointer"
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

                  {/* Split 2 */}
                  <div className="flex items-center gap-2">
                    <select
                      value={splitMetode2}
                      onChange={(e) => setSplitMetode2(e.target.value as "TUNAI" | "TRANSFER" | "QRIS" | "DEBIT")}
                      className="rounded-xl border border-stone-300 bg-white px-2 py-1.5 font-bold text-stone-800 outline-none text-xs cursor-pointer"
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
                        className={`rounded-xl py-1.5 text-[11px] font-bold border transition cursor-pointer ${
                          metodeBayar === method
                            ? "border-amber-600 bg-amber-700 text-white shadow-xs"
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
              className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-sage-900 py-3.5 text-xs font-bold text-white shadow-xl transition hover:bg-sage-800 active:scale-[0.99] disabled:opacity-50 cursor-pointer"
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

      {/* OPTIONAL FULL CATALOG MODAL */}
      {showCatalogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-3xl max-h-[85vh] overflow-hidden rounded-3xl bg-white p-6 shadow-2xl flex flex-col space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h3 className="font-bold text-stone-900 text-lg">Katalog Lengkap Perawatan &amp; Produk</h3>
                <p className="text-xs text-stone-500">Klik item untuk menambahkannya ke keranjang kasir.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowCatalogModal(false)}
                className="rounded-full p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-700 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 pr-1 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {produkList.map((p) => {
                  const qtyInCart = cartMap.get(p.id) || 0;
                  return (
                    <div
                      key={p.id}
                      onClick={() => {
                        addToCart(p);
                        toast.success(`${p.nama} ditambahkan ke keranjang`, "Kasir POS", 1200);
                      }}
                      className={`flex items-center justify-between p-3 rounded-2xl border transition cursor-pointer ${
                        qtyInCart > 0
                          ? "border-sage-600 bg-sage-50/70"
                          : "border-stone-200 bg-white hover:border-sage-400 hover:shadow-xs"
                      }`}
                    >
                      <div>
                        <span className="text-[10px] font-bold text-gold-700 bg-gold-50 px-2 py-0.5 rounded-full border border-gold-200">
                          {p.kategori?.nama ?? "Umum"}
                        </span>
                        <p className="font-bold text-stone-900 text-xs mt-1">{p.nama}</p>
                        <p className="text-[11px] text-stone-500">{rupiah(p.harga)}</p>
                      </div>

                      <button
                        type="button"
                        className={`rounded-xl px-3 py-1.5 text-xs font-bold transition flex items-center gap-1 ${
                          qtyInCart > 0 ? "bg-sage-900 text-white" : "bg-stone-100 text-stone-700 hover:bg-sage-700 hover:text-white"
                        }`}
                      >
                        {qtyInCart > 0 ? `(x${qtyInCart}) +` : "+ Tambah"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-stone-100 pt-3 flex justify-end">
              <button
                type="button"
                onClick={() => setShowCatalogModal(false)}
                className="rounded-2xl bg-sage-900 px-6 py-2.5 text-xs font-bold text-white hover:bg-sage-800 cursor-pointer"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
