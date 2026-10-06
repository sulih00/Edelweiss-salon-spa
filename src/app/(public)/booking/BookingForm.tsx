"use client";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Input, Label, Btn, useAlert } from "@/components/ui";
import { rupiah } from "@/lib/utils";
import { WA_ADMIN, waLink, pesanBookingBaru } from "@/lib/wa";
import { Check, ChevronLeft, ChevronRight, CalendarHeart, Sparkles, UserRound, TicketPercent, Landmark, Copy, UploadCloud, X, Clock, UserCheck } from "lucide-react";
import { DP_MINIMAL, type Rekening } from "@/lib/bank";

type L = { id: string; nama: string; harga: number; durasiMenit: number; kategori: { nama: string }; foto?: string | null };
type K = { id: string; nama: string; jabatan: string };
type Slot = { jam: string; terisi: boolean; isPast: boolean; capacity: number; bookedCount: number };

const steps = ["Layanan", "Data Diri", "Jadwal & Terapis", "Selesai"];

export default function BookingForm({
  layanan,
  rekening,
  karyawan = [],
  preselected,
}: {
  layanan: L[];
  rekening: Rekening[];
  karyawan?: K[];
  preselected?: string;
}) {
  const { alert } = useAlert();
  const [step, setStep] = useState(0);

  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }, []);

  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [selectedKaryawan, setSelectedKaryawan] = useState("bebas");
  const [selectedJam, setSelectedJam] = useState("");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const [form, setForm] = useState({
    nama: "",
    wa: "",
    produkId: preselected ?? layanan[0]?.id ?? "",
    karyawanId: "bebas",
    jadwal: "",
    catatan: "",
    kodePromo: "",
    buktiTF: "",
  });

  const [msg, setMsg] = useState("");
  const [waUrl, setWaUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [promo, setPromo] = useState<{ diskon: number; total: number; nama: string } | null>(null);
  const [promoErr, setPromoErr] = useState("");
  const [cekLoading, setCekLoading] = useState(false);
  const [tfLoading, setTfLoading] = useState(false);
  const [tfErr, setTfErr] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  const selectedLayanan = useMemo(() => layanan.find((l) => l.id === form.produkId), [layanan, form.produkId]);
  const selectedTerapisObj = useMemo(() => karyawan.find((k) => k.id === selectedKaryawan), [karyawan, selectedKaryawan]);

  // WIB (UTC+7): slot yang dipilih adalah jam dinding Jakarta.
  const fullJadwal = (selectedDate && selectedJam) ? `${selectedDate}T${selectedJam}:00+07:00` : "";

  const canNext1 = !!form.produkId;
  const canNext2 = form.nama.trim().length >= 2 && form.wa.replace(/\D/g, "").length >= 9;
  const canSubmit = fullJadwal !== "";

  // Fetch slot ketersediaan dari API ketika tanggal, terapis, atau layanan (durasi) berubah
  useEffect(() => {
    if (!selectedDate) return;
    let mounted = true;
    Promise.resolve().then(() => {
      if (mounted) setLoadingSlots(true);
    });
    fetch(`/api/booking/slots?tanggal=${selectedDate}&karyawanId=${selectedKaryawan}&produkId=${form.produkId}`)
      .then((r) => r.json())
      .then((d) => {
        if (mounted) {
          setSlots(d.slots ?? []);
          setLoadingSlots(false);
        }
      })
      .catch(() => {
        if (mounted) setLoadingSlots(false);
      });
    return () => {
      mounted = false;
    };
  }, [selectedDate, selectedKaryawan, form.produkId]);

  async function cekPromo() {
    if (!form.kodePromo.trim() || !selectedLayanan) return;
    setCekLoading(true);
    setPromoErr("");
    setPromo(null);
    try {
      const res = await fetch("/api/promo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kode: form.kodePromo, produkId: form.produkId }),
      });
      const j = await res.json();
      setCekLoading(false);
      if (j.ok) {
        setPromo({ diskon: j.diskon, total: j.total, nama: j.promo.nama });
      } else {
        const errMsg = j.error ?? "Kode tidak valid";
        setPromoErr(errMsg);
        await alert(
          `Kode promo "${form.kodePromo}" tidak valid (${errMsg}). Booking Anda tetap dapat dilanjutkan dengan harga normal.`,
          "Notifikasi Kode Promo",
          "warning"
        );
      }
    } catch {
      setCekLoading(false);
      setPromoErr("Gagal mengecek promo");
    }
  }

  async function uploadBukti(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setTfLoading(true);
    setTfErr("");
    const fd = new FormData();
    fd.append("file", f);
    const res = await fetch("/api/upload-bukti", { method: "POST", body: fd });
    const j = await res.json();
    setTfLoading(false);
    if (res.ok) {
      setForm((s) => ({
        ...s,
        buktiTF: j.url,
      }));
    } else setTfErr(j.error ?? "Upload gagal");
  }

  function copyNomor(nomor: string) {
    navigator.clipboard?.writeText(nomor).then(() => {
      setCopied(nomor);
      setTimeout(() => setCopied(null), 1500);
    });
  }

  async function submit() {
    setLoading(true);
    setMsg("");
    setWaUrl("");
    try {
      const res = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          jadwal: fullJadwal,
          karyawanId: selectedKaryawan,
        }),
      });
      const j = await res.json();
      setLoading(false);
      if (res.ok) {
        if (j.promoNote) {
          await alert(j.promoNote, "Notifikasi Promo", "warning");
        }
        const jadwalTxt = `${new Date(j.jadwal).toLocaleDateString("id-ID", { timeZone: "Asia/Jakarta", weekday: "long", day: "numeric", month: "long" })} jam ${new Date(j.jadwal).toLocaleTimeString("id-ID", { timeZone: "Asia/Jakarta", hour: "2-digit", minute: "2-digit" })}`;
        const terapisTxt = selectedTerapisObj ? ` dengan terapis ${selectedTerapisObj.nama}` : "";
        setMsg(`Booking ${j.layanan}${terapisTxt} untuk ${jadwalTxt} diterima.${j.diskon ? ` Hemat ${rupiah(j.diskon)} (total ${rupiah(j.total)}).` : ""}`);
        setWaUrl(waLink(WA_ADMIN, pesanBookingBaru(j.nama, `${j.layanan}${terapisTxt}`, jadwalTxt, j.buktiTF)));
        setStep(3);
      } else setMsg("✕ " + (j.error ?? "Gagal"));
    } catch {
      setLoading(false);
      setMsg("✕ Gagal mengirimkan booking");
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-1">
        {steps.map((s, k) => (
          <div key={s} className="flex flex-1 items-center gap-1 last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <span className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition ${k < step ? "bg-sage-700 text-white" : k === step ? "bg-gold-400 text-sage-900 ring-4 ring-gold-400/25" : "bg-stone-100 text-stone-400"}`}>
                {k < step ? <Check size={14} /> : k + 1}
              </span>
              <span className={`hidden text-[11px] sm:block ${k === step ? "font-bold text-sage-800" : "text-stone-400"}`}>{s}</span>
            </div>
            {k < steps.length - 1 && <div className={`mb-5 h-0.5 flex-1 rounded ${k < step ? "bg-sage-700" : "bg-stone-200"}`} />}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* STEP 0: Pilih Layanan */}
        {step === 0 && (
          <motion.div key="s0" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="grid max-h-[380px] gap-2 overflow-y-auto pr-1">
            {layanan.map((l) => (
              <button key={l.id} type="button" onClick={() => { setForm({ ...form, produkId: l.id }); setPromo(null); setPromoErr(""); }} className={`flex items-center gap-3 rounded-2xl border p-3 text-left transition ${form.produkId === l.id ? "border-sage-700 bg-sage-50 ring-2 ring-sage-200" : "border-stone-200 hover:border-sage-400"}`}>
                {l.foto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={l.foto} alt="" className="h-12 w-12 rounded-xl object-cover" />
                ) : (
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-sage-100"><Sparkles size={18} className="text-sage-600" /></span>
                )}
                <span className="flex-1">
                  <span className="block text-sm font-bold text-sage-900">{l.nama}</span>
                  <span className="block text-xs text-stone-500">{l.kategori.nama} • {l.durasiMenit} mnt</span>
                </span>
                <span className="text-sm font-bold text-sage-700">{rupiah(l.harga)}</span>
              </button>
            ))}
          </motion.div>
        )}

        {/* STEP 1: Data Diri */}
        {step === 1 && (
          <motion.div key="s1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-4">
            <div className="flex items-center gap-2 rounded-2xl bg-sage-50 p-3 text-sm"><UserRound size={16} className="text-sage-700" /> Data ini dipakai untuk konfirmasi via WhatsApp.</div>
            <div><Label>Nama lengkap</Label><Input value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} placeholder="Nama kamu" /></div>
            <div><Label>No. WhatsApp aktif</Label><Input value={form.wa} onChange={(e) => setForm({ ...form, wa: e.target.value })} placeholder="08xx..." inputMode="tel" /></div>
            <div><Label>Catatan (opsional)</Label><Input value={form.catatan} onChange={(e) => setForm({ ...form, catatan: e.target.value })} placeholder="Request penanganan khusus / alergi / dll" /></div>
          </motion.div>
        )}

        {/* STEP 2: Jadwal & Pilih Terapis */}
        {step === 2 && (
          <motion.div key="s2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-5">
            {/* Pilih Terapis */}
            <div>
              <Label className="flex items-center gap-1.5"><UserCheck size={16} className="text-sage-700" /> Pilih Terapis Favorit</Label>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={() => { setSelectedKaryawan("bebas"); setSelectedJam(""); }}
                  className={`rounded-xl border p-2.5 text-left transition ${selectedKaryawan === "bebas" ? "border-sage-700 bg-sage-700 text-white shadow-md" : "border-stone-200 bg-white hover:border-sage-400"}`}
                >
                  <p className="text-xs font-bold">✨ Bebas / Siapa Saja</p>
                  <p className={`text-[11px] ${selectedKaryawan === "bebas" ? "text-sage-100" : "text-stone-400"}`}>Terapis yang tersedia</p>
                </button>
                {karyawan.map((k) => (
                  <button
                    key={k.id}
                    type="button"
                    onClick={() => { setSelectedKaryawan(k.id); setSelectedJam(""); }}
                    className={`rounded-xl border p-2.5 text-left transition ${selectedKaryawan === k.id ? "border-sage-700 bg-sage-700 text-white shadow-md" : "border-stone-200 bg-white hover:border-sage-400"}`}
                  >
                    <p className="text-xs font-bold truncate">{k.nama}</p>
                    <p className={`text-[11px] truncate ${selectedKaryawan === k.id ? "text-sage-100" : "text-stone-400"}`}>{k.jabatan}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Pilih Tanggal */}
            <div>
              <Label className="flex items-center gap-1.5"><CalendarHeart size={16} className="text-sage-700" /> Pilih Tanggal Kedatangan</Label>
              <Input
                type="date"
                min={todayStr}
                value={selectedDate}
                onChange={(e) => { setSelectedDate(e.target.value); setSelectedJam(""); }}
                className="mt-1"
              />
            </div>

            {/* Grid Slot Waktu (Jam) */}
            <div>
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-1.5"><Clock size={16} className="text-sage-700" /> Pilih Slot Waktu (09:00 - 19:00)</Label>
                {loadingSlots && <span className="text-xs text-stone-400 animate-pulse">Memuat slot...</span>}
              </div>

              <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
                {slots.map((s) => {
                  const isSelected = selectedJam === s.jam;
                  return (
                    <button
                      key={s.jam}
                      type="button"
                      disabled={s.terisi}
                      onClick={() => setSelectedJam(s.jam)}
                      className={`flex flex-col items-center justify-center rounded-xl border py-2.5 px-1 transition ${
                        s.terisi
                          ? "border-stone-200 bg-stone-100 text-stone-300 cursor-not-allowed"
                          : isSelected
                          ? "border-gold-500 bg-gold-400 text-sage-900 font-bold shadow-md ring-2 ring-gold-300"
                          : "border-stone-200 bg-white text-stone-700 hover:border-sage-600 hover:bg-sage-50"
                      }`}
                    >
                      <span className="text-sm font-semibold">{s.jam}</span>
                      <span className="text-[10px]">
                        {s.isPast ? "Lewat" : s.terisi ? "Penuh" : "Tersedia"}
                      </span>
                    </button>
                  );
                })}
              </div>
              {!selectedJam && <p className="mt-1.5 text-xs text-stone-400">Pilih salah satu jam yang berwarna putih/tersedia di atas.</p>}
            </div>

            {/* Diskon Promo */}
            <div>
              <Label>Kode promo (opsional)</Label>
              <div className="flex gap-2">
                <Input value={form.kodePromo} onChange={(e) => { setForm({ ...form, kodePromo: e.target.value.toUpperCase() }); setPromo(null); setPromoErr(""); }} placeholder="cth GLOWING10" className="uppercase" />
                <button type="button" onClick={cekPromo} disabled={cekLoading || !form.kodePromo.trim()} className="flex shrink-0 items-center gap-1 rounded-xl bg-sage-700 px-4 text-sm font-semibold text-white disabled:opacity-40">
                  <TicketPercent size={15} /> {cekLoading ? "..." : "Cek"}
                </button>
              </div>
              {promo && <p className="mt-1 text-xs font-semibold text-green-700">✓ {promo.nama} — hemat {rupiah(promo.diskon)}, total {rupiah(promo.total)}</p>}
              {promoErr && <p className="mt-1 text-xs text-red-600">✕ {promoErr}</p>}
              <a href="/promo" target="_blank" className="mt-1 inline-block text-xs text-sage-700 underline">Lihat promo aktif</a>
            </div>

            {/* Summary Booking Card */}
            {selectedLayanan && (
              <div className="rounded-2xl border border-sage-200 bg-sage-50/60 p-4 text-sm space-y-1">
                <p className="font-bold text-sage-900">{selectedLayanan.nama}</p>
                <p className="text-stone-600">
                  Terapis: <b>{selectedTerapisObj?.nama ?? "Bebas / Siapa Saja"}</b>
                </p>
                <p className="text-stone-600">
                  Jadwal: <b>{selectedDate && selectedJam ? `${selectedDate} jam ${selectedJam}` : "Belum pilih jam"}</b>
                </p>
              </div>
            )}

            {/* Pembayaran & DP */}
            <div className="rounded-2xl border border-gold-400/50 bg-gold-400/10 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="flex items-center gap-2 text-sm font-bold text-sage-900"><Landmark size={16} /> Transfer ke rekening resmi</p>
                <span className="rounded-full bg-gold-400/30 px-3 py-1 text-xs font-bold text-sage-900 border border-gold-500/40">
                  Minimal Booking: Rp 50.000
                </span>
              </div>
              <p className="mt-1 text-xs text-stone-600">
                Silakan melakukan transfer <b>minimal booking Rp 50.000</b> ke rekening resmi di bawah ini untuk konfirmasi jadwal.
              </p>
              <div className="mt-2 space-y-2">
                {rekening.length === 0 && (
                  <p className="rounded-xl bg-white px-3 py-2 text-xs text-stone-400">
                    Nomor rekening sedang diperbarui — silakan konfirmasi via WhatsApp setelah booking.
                  </p>
                )}
                {rekening.map((r) => (
                  <div key={`${r.bank}-${r.nomor}`} className="flex items-center justify-between gap-2 rounded-xl bg-white px-3 py-2 text-sm">
                    <span><b>{r.bank}</b> <span className="font-mono tracking-wider">{r.nomor}</span><br /><span className="text-xs text-stone-400">a.n. {r.atasNama}</span></span>
                    <button type="button" onClick={() => copyNomor(r.nomor)} className="flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold text-sage-700">
                      <Copy size={12} /> {copied === r.nomor ? "Disalin!" : "Salin"}
                    </button>
                  </div>
                ))}
              </div>
              <div className="mt-3">
                <Label>Upload bukti transfer (opsional, maks 2MB)</Label>
                {!form.buktiTF ? (
                  <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-sage-300 bg-white px-4 py-4 text-sm text-stone-500 transition hover:border-sage-600">
                    <UploadCloud size={18} className="text-sage-600" />
                    {tfLoading ? "Mengupload..." : "Pilih foto bukti transfer"}
                    <input type="file" accept="image/*" className="hidden" onChange={uploadBukti} disabled={tfLoading} />
                  </label>
                ) : (
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={form.buktiTF} alt="Bukti transfer" className="h-36 w-full rounded-xl border object-cover" />
                    <button type="button" onClick={() => setForm((s) => ({ ...s, buktiTF: "" }))} className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-xs text-white">
                      <X size={12} /> Ganti
                    </button>
                  </div>
                )}
                {tfErr && <p className="mt-1 text-xs text-red-600">✕ {tfErr}</p>}
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 3: Sukses */}
        {step === 3 && (
          <motion.div key="s3" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="py-4 text-center">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-sage-700 text-white"><Check size={28} /></span>
            <p className="font-serif-display mt-4 text-2xl font-bold text-sage-900">Booking diterima!</p>
            <p className="mt-1 text-sm text-stone-500">{msg}</p>
            {waUrl && (
              <a href={waUrl} target="_blank" rel="noreferrer" className="mt-5 inline-block rounded-full bg-[#25D366] px-7 py-3 text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5">
                Konfirmasi via WhatsApp
              </a>
            )}
            <div>
              <button
                onClick={() => {
                  setStep(0);
                  setMsg("");
                  setWaUrl("");
                  setPromo(null);
                  setPromoErr("");
                  setSelectedJam("");
                  setForm({ nama: "", wa: "", produkId: layanan[0]?.id ?? "", karyawanId: "bebas", jadwal: "", catatan: "", kodePromo: "", buktiTF: "" });
                }}
                className="mt-3 text-sm text-stone-400 underline"
              >
                Buat booking lain
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {step < 3 && (
        <div className="mt-6 flex justify-between">
          <button disabled={step === 0} onClick={() => setStep(step - 1)} className="flex items-center gap-1 rounded-full border px-5 py-2.5 text-sm disabled:opacity-40">
            <ChevronLeft size={15} /> Kembali
          </button>
          {step < 2 ? (
            <Btn disabled={(step === 0 && !canNext1) || (step === 1 && !canNext2)} onClick={() => setStep(step + 1)} className="flex items-center gap-1">
              Lanjut <ChevronRight size={15} />
            </Btn>
          ) : (
            <Btn disabled={!canSubmit || loading} onClick={submit}>
              {loading ? "Mengirim..." : "Kirim Booking ✨"}
            </Btn>
          )}
        </div>
      )}
      {msg && step !== 3 && <p className="mt-3 text-sm text-red-600">{msg}</p>}
    </div>
  );
}
