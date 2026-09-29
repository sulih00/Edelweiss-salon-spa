"use client";

import { useEffect, useState, useCallback } from "react";
import {
  MapPin,
  Plus,
  Edit2,
  Trash2,
  ExternalLink,
  Navigation,
  CheckCircle2,
  AlertCircle,
  LocateFixed,
  RefreshCw,
} from "lucide-react";

export type LokasiItem = {
  id: string;
  nama: string;
  alamat: string | null;
  lat: number;
  lon: number;
  zoom: number;
  utama: boolean;
  createdAt: string;
  updatedAt: string;
};

export default function LokasiClient() {
  const [list, setList] = useState<LokasiItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errMessage, setErrMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<LokasiItem | null>(null);

  // Form states focused on lat & lon
  const [nama, setNama] = useState("Edelweiss Salon & Spa");
  const [alamat, setAlamat] = useState("");
  const [latInput, setLatInput] = useState("");
  const [lonInput, setLonInput] = useState("");
  const [zoom, setZoom] = useState(16);
  const [utama, setUtama] = useState(true);
  const [geoLoading, setGeoLoading] = useState(false);

  const fetchLokasi = useCallback(async () => {
    setErrMessage("");
    try {
      const res = await fetch("/api/cms/lokasi");
      if (!res.ok) throw new Error("Gagal mengambil data lokasi");
      const data = await res.json();
      setList(data);
    } catch (err: unknown) {
      setErrMessage(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    Promise.resolve().then(() => {
      fetchLokasi();
    });
  }, [fetchLokasi]);

  const loadData = useCallback(() => {
    setLoading(true);
    fetchLokasi();
  }, [fetchLokasi]);

  function openCreateModal() {
    setEditItem(null);
    setNama("Edelweiss Salon & Spa");
    setAlamat("");
    setLatInput("-6.2088");
    setLonInput("106.8456");
    setZoom(16);
    setUtama(list.length === 0);
    setErrMessage("");
    setModalOpen(true);
  }

  function openEditModal(item: LokasiItem) {
    setEditItem(item);
    setNama(item.nama);
    setAlamat(item.alamat || "");
    setLatInput(String(item.lat));
    setLonInput(String(item.lon));
    setZoom(item.zoom || 16);
    setUtama(item.utama);
    setErrMessage("");
    setModalOpen(true);
  }

  function handleGetGPS() {
    if (!navigator.geolocation) {
      alert("Browser Anda tidak mendukung Geolocation GPS");
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatInput(pos.coords.latitude.toFixed(6));
        setLonInput(pos.coords.longitude.toFixed(6));
        setGeoLoading(false);
      },
      (error) => {
        setGeoLoading(false);
        alert("Gagal mendapatkan lokasi GPS: " + error.message);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErrMessage("");
    setSuccessMessage("");

    const parsedLat = parseFloat(latInput.replace(",", "."));
    const parsedLon = parseFloat(lonInput.replace(",", "."));

    if (isNaN(parsedLat) || isNaN(parsedLon)) {
      setErrMessage("Harap masukkan nilai Latitude dan Longitude yang valid.");
      setSaving(false);
      return;
    }

    if (parsedLat < -90 || parsedLat > 90) {
      setErrMessage("Latitude harus bernilai antara -90 dan 90");
      setSaving(false);
      return;
    }

    if (parsedLon < -180 || parsedLon > 180) {
      setErrMessage("Longitude harus bernilai antara -180 dan 180");
      setSaving(false);
      return;
    }

    try {
      const payload = {
        id: editItem?.id,
        nama,
        alamat,
        lat: parsedLat,
        lon: parsedLon,
        zoom,
        utama,
      };

      const res = await fetch("/api/cms/lokasi", {
        method: editItem ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menyimpan data lokasi");

      setSuccessMessage(editItem ? "Lokasi berhasil diperbarui ✨" : "Lokasi baru berhasil ditambahkan ✨");
      setModalOpen(false);
      loadData();
    } catch (err: unknown) {
      setErrMessage(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setSaving(false);
    }
  }

  async function handleSetUtama(item: LokasiItem) {
    if (item.utama) return;
    try {
      const res = await fetch("/api/cms/lokasi", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, utama: true }),
      });
      if (!res.ok) throw new Error("Gagal mengubah lokasi utama");
      setSuccessMessage(`Lokasi "${item.nama}" dijadikan lokasi utama di website.`);
      loadData();
    } catch (err: unknown) {
      setErrMessage(err instanceof Error ? err.message : "Gagal mengubah lokasi utama");
    }
  }

  async function handleDelete(item: LokasiItem) {
    if (!confirm(`Apakah Anda yakin ingin menghapus lokasi "${item.nama}"?`)) return;

    try {
      const res = await fetch(`/api/cms/lokasi?id=${item.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menghapus lokasi");

      setSuccessMessage("Lokasi berhasil dihapus.");
      loadData();
    } catch (err: unknown) {
      setErrMessage(err instanceof Error ? err.message : "Gagal menghapus lokasi");
    }
  }

  const currentParsedLat = parseFloat(latInput.replace(",", "."));
  const currentParsedLon = parseFloat(lonInput.replace(",", "."));
  const isValidPreview = !isNaN(currentParsedLat) && !isNaN(currentParsedLon);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 rounded-3xl border border-stone-200 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sage-800 text-gold-300 shadow-md">
            <MapPin size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-stone-900 md:text-2xl">Pengaturan Maps & Lokasi (Lat / Lon)</h1>
            <p className="mt-1 text-sm text-stone-500">
              Inputkan titik koordinat <strong>Latitude (Lat)</strong> & <strong>Longitude (Lon)</strong> secara presisi agar pin Google Maps pada website publik tepat di lokasi salon Anda.
            </p>
          </div>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-sage-800 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sage-900 shadow-md hover:-translate-y-0.5 cursor-pointer"
        >
          <Plus size={18} /> Tambah Lokasi
        </button>
      </div>

      {/* Messages */}
      {successMessage && (
        <div className="flex items-center gap-3 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-800">
          <CheckCircle2 size={18} className="text-green-600" />
          <span>{successMessage}</span>
          <button onClick={() => setSuccessMessage("")} className="ml-auto text-xs font-bold hover:underline">Tutup</button>
        </div>
      )}

      {errMessage && (
        <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800">
          <AlertCircle size={18} className="text-red-600" />
          <span>{errMessage}</span>
          <button onClick={() => setErrMessage("")} className="ml-auto text-xs font-bold hover:underline">Tutup</button>
        </div>
      )}

      {/* Location Cards */}
      {loading ? (
        <div className="flex items-center justify-center rounded-3xl border border-stone-200 bg-white p-12 text-stone-400">
          <RefreshCw size={24} className="animate-spin text-sage-600" />
          <span className="ml-3 text-sm font-medium">Memuat data lokasi...</span>
        </div>
      ) : list.length === 0 ? (
        <div className="rounded-3xl border border-stone-200 bg-white p-12 text-center shadow-sm">
          <MapPin size={40} className="mx-auto text-stone-300" />
          <p className="mt-3 font-semibold text-stone-800">Belum ada lokasi tersimpan</p>
          <p className="mt-1 text-sm text-stone-500">Klik tombol &apos;Tambah Lokasi&apos; untuk memasukkan titik koordinat lat & lon pertama Anda.</p>
          <button
            onClick={openCreateModal}
            className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-sage-800 px-5 py-2.5 text-sm font-medium text-white hover:bg-sage-900 cursor-pointer"
          >
            <Plus size={16} /> Tambah Lokasi Sekarang
          </button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {list.map((item) => (
            <div
              key={item.id}
              className={`relative flex flex-col overflow-hidden rounded-3xl border transition shadow-sm ${
                item.utama ? "border-gold-400/80 bg-stone-900/5 ring-2 ring-gold-400/30" : "border-stone-200 bg-white"
              }`}
            >
              {/* Map View Frame */}
              <div className="relative h-48 w-full border-b border-stone-200 bg-stone-100">
                <iframe
                  title={`Map ${item.nama}`}
                  src={`https://maps.google.com/maps?q=${item.lat},${item.lon}&z=${item.zoom || 16}&output=embed`}
                  className="h-full w-full border-0 grayscale-[20%]"
                  loading="lazy"
                />
                {item.utama && (
                  <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-gold-500 px-3 py-1 text-xs font-bold text-sage-950 shadow-md">
                    <CheckCircle2 size={13} /> LOKASI UTAMA (WEBSITE)
                  </span>
                )}
              </div>

              {/* Location Details */}
              <div className="flex flex-1 flex-col p-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="font-bold text-stone-900">{item.nama}</h2>
                    {item.alamat && <p className="mt-1 text-xs text-stone-500">{item.alamat}</p>}
                  </div>
                </div>

                {/* Lat Lon Badge Grid */}
                <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-xl border border-stone-200 bg-stone-50 p-2.5">
                    <span className="block text-[10px] font-bold tracking-wider text-stone-400 uppercase">Latitude (Lat)</span>
                    <span className="font-mono text-sm font-bold text-sage-900">{item.lat}</span>
                  </div>
                  <div className="rounded-xl border border-stone-200 bg-stone-50 p-2.5">
                    <span className="block text-[10px] font-bold tracking-wider text-stone-400 uppercase">Longitude (Lon)</span>
                    <span className="font-mono text-sm font-bold text-sage-900">{item.lon}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-5 flex items-center justify-between border-t border-stone-100 pt-4 text-xs">
                  <a
                    href={`https://www.google.com/maps?q=${item.lat},${item.lon}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-semibold text-sage-700 hover:underline"
                  >
                    <ExternalLink size={13} /> Tes Google Maps
                  </a>

                  <div className="flex items-center gap-2">
                    {!item.utama && (
                      <button
                        onClick={() => handleSetUtama(item)}
                        className="rounded-xl border border-stone-200 bg-white px-3 py-1.5 font-semibold text-stone-700 hover:bg-stone-50 cursor-pointer"
                      >
                        Jadikan Utama
                      </button>
                    )}
                    <button
                      onClick={() => openEditModal(item)}
                      className="rounded-xl border border-stone-200 bg-white p-2 text-stone-600 hover:bg-stone-50 cursor-pointer"
                      title="Edit Koordinat"
                    >
                      <Edit2 size={15} />
                    </button>
                    {list.length > 1 && (
                      <button
                        onClick={() => handleDelete(item)}
                        className="rounded-xl border border-red-200 bg-red-50 p-2 text-red-600 hover:bg-red-100 cursor-pointer"
                        title="Hapus Lokasi"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Form Create / Edit */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-xl animate-bloom overflow-hidden rounded-3xl bg-white shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-stone-200 bg-stone-50 px-6 py-4">
              <div className="flex items-center gap-2.5">
                <MapPin className="text-sage-700" size={20} />
                <h3 className="font-bold text-stone-900">
                  {editItem ? "Edit Koordinat Maps" : "Tambah Lokasi Maps (Lat / Lon)"}
                </h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-full p-1.5 text-stone-400 hover:bg-stone-200 hover:text-stone-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Nama Outlet */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Nama Outlet / Lokasi
                </label>
                <input
                  type="text"
                  required
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  placeholder="Contoh: Edelweiss Salon & Spa - Pusat"
                  className="w-full rounded-2xl border border-stone-300 px-4 py-2.5 text-sm focus:border-sage-600 focus:outline-none"
                />
              </div>

              {/* Coordinates Section */}
              <div className="rounded-2xl border border-sage-200 bg-sage-50/50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-sage-900 uppercase tracking-wider">
                    Koordinat Presisi (Lat & Lon)
                  </span>
                  <button
                    type="button"
                    onClick={handleGetGPS}
                    disabled={geoLoading}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-sage-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sage-900 disabled:opacity-50 cursor-pointer"
                  >
                    <LocateFixed size={14} className={geoLoading ? "animate-spin" : ""} />
                    {geoLoading ? "Mengambil GPS..." : "📍 Ambil GPS Saya"}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-stone-600 mb-1">
                      Latitude (Lat) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={latInput}
                      onChange={(e) => setLatInput(e.target.value)}
                      placeholder="-6.2088"
                      className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-sm font-mono focus:border-sage-600 focus:outline-none"
                    />
                    <span className="text-[10px] text-stone-400">Contoh: -6.2088</span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-600 mb-1">
                      Longitude (Lon) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={lonInput}
                      onChange={(e) => setLonInput(e.target.value)}
                      placeholder="106.8456"
                      className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-sm font-mono focus:border-sage-600 focus:outline-none"
                    />
                    <span className="text-[10px] text-stone-400">Contoh: 106.8456</span>
                  </div>
                </div>

                {isValidPreview && (
                  <div className="pt-1 flex items-center justify-between text-xs">
                    <span className="text-stone-500">Hasil Pin: {currentParsedLat}, {currentParsedLon}</span>
                    <a
                      href={`https://www.google.com/maps?q=${currentParsedLat},${currentParsedLon}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 font-bold text-sage-700 hover:underline"
                    >
                      <Navigation size={12} /> Buka Tab Google Maps
                    </a>
                  </div>
                )}
              </div>

              {/* Zoom & Address */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Zoom Level ({zoom})
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="20"
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="w-full accent-sage-700 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-stone-400">
                    <span>10 (Kota)</span>
                    <span>16 (Jalan/Gedung)</span>
                    <span>20 (Dekat)</span>
                  </div>
                </div>

                <div className="flex items-center pt-3">
                  <label className="flex items-center gap-2 text-sm font-semibold text-stone-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={utama}
                      onChange={(e) => setUtama(e.target.checked)}
                      className="h-4 w-4 rounded border-stone-300 text-sage-700 focus:ring-sage-600 cursor-pointer"
                    />
                    Jadikan Lokasi Utama Website
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Alamat Lengkap (Opsional)
                </label>
                <textarea
                  rows={2}
                  value={alamat}
                  onChange={(e) => setAlamat(e.target.value)}
                  placeholder="Jl. Anggrek No. 123, Kel. Kebon Jeruk, Jakarta Barat"
                  className="w-full rounded-2xl border border-stone-300 px-4 py-2.5 text-sm focus:border-sage-600 focus:outline-none"
                />
              </div>

              {/* Live Preview Iframe */}
              {isValidPreview && (
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Prinjau Peta Langsung (Live Preview)
                  </label>
                  <div className="h-44 w-full overflow-hidden rounded-2xl border border-stone-300 bg-stone-100">
                    <iframe
                      title="Preview Map"
                      src={`https://maps.google.com/maps?q=${currentParsedLat},${currentParsedLon}&z=${zoom}&output=embed`}
                      className="h-full w-full border-0"
                    />
                  </div>
                </div>
              )}

              {/* Footer Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-2xl border border-stone-300 px-5 py-2.5 text-sm font-semibold text-stone-700 hover:bg-stone-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-2xl bg-sage-800 px-6 py-2.5 text-sm font-semibold text-white hover:bg-sage-900 disabled:opacity-50 cursor-pointer"
                >
                  {saving && <RefreshCw size={16} className="animate-spin" />}
                  {saving ? "Menyimpan..." : "Simpan Lokasi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
