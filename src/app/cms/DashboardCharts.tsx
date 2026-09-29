"use client";

import { useState } from "react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, BarChart, Bar, Legend,
} from "recharts";
import { rupiah } from "@/lib/utils";
import { TrendingUp, PieChart as PieIcon, BarChart3, Wallet, Award, Sparkles } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  BARU: "#d97706",        // Amber
  DIKONFIRMASI: "#2563eb",// Blue
  SELESAI: "#16a34a",     // Green
  BATAL: "#dc2626",       // Red
};

const PAYMENT_COLORS: Record<string, string> = {
  TUNAI: "#16a34a",    // Green
  QRIS: "#8b5cf6",     // Purple
  TRANSFER: "#2563eb", // Blue
  DEBIT: "#f59e0b",    // Amber
  LAINNYA: "#6b7280",  // Gray
};

export type Daily = { tgl: string; masuk: number; keluar: number };
export type StatusRow = { status: string; jumlah: number };
export type TopRow = { layanan: string; jumlah: number };
export type PaymentRow = { metode: string; total: number; count: number };

interface DashboardChartsProps {
  daily: Daily[];
  byStatus: StatusRow[];
  top: TopRow[];
  paymentData?: PaymentRow[];
}

export default function DashboardCharts({ daily, byStatus, top, paymentData = [] }: DashboardChartsProps) {
  const [range, setRange] = useState<"14" | "30">("14");

  // Format custom tooltip for Area Chart
  const CustomAreaTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-2xl border border-stone-200/80 bg-white/95 p-3.5 shadow-xl text-xs space-y-1.5 backdrop-blur-md">
          <p className="font-bold text-stone-900 border-b border-stone-100 pb-1">{label}</p>
          <div className="flex items-center justify-between gap-4 text-emerald-700 font-semibold">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500" /> Kas Masuk:
            </span>
            <span>{rupiah(payload[0]?.value || 0)}</span>
          </div>
          {payload[1] && (
            <div className="flex items-center justify-between gap-4 text-rose-600 font-semibold">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-rose-500" /> Kas Keluar:
              </span>
              <span>{rupiah(payload[1]?.value || 0)}</span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  const totalOmzetPeriod = daily.reduce((acc, d) => acc + d.masuk, 0);
  const totalKeluarPeriod = daily.reduce((acc, d) => acc + d.keluar, 0);

  return (
    <div className="mt-5 space-y-5">
      {/* 1. Main Cash Flow Chart Header & Area Chart */}
      <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp size={20} className="text-sage-700" />
              <h2 className="font-serif-display text-xl font-bold text-stone-900">
                Grafik Arus Kas &amp; Omzet Salon
              </h2>
            </div>
            <p className="text-xs text-stone-500">
              Perbandingan pendapatan kas masuk vs pengeluaran operasional.
            </p>
          </div>

          {/* Quick Metrics Pills */}
          <div className="flex items-center gap-2">
            <div className="rounded-2xl bg-emerald-50 px-3.5 py-1.5 border border-emerald-200/80 text-xs">
              <span className="text-stone-500 font-medium">Total Masuk: </span>
              <b className="text-emerald-800 font-bold">{rupiah(totalOmzetPeriod)}</b>
            </div>
            <div className="rounded-2xl bg-rose-50 px-3.5 py-1.5 border border-rose-200/80 text-xs">
              <span className="text-stone-500 font-medium">Total Keluar: </span>
              <b className="text-rose-700 font-bold">{rupiah(totalKeluarPeriod)}</b>
            </div>
          </div>
        </div>

        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={daily} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorMasuk" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#16a34a" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#16a34a" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorKeluar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#dc2626" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#dc2626" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="tgl" tick={{ fontSize: 11, fill: "#78716c" }} interval={1} />
              <YAxis
                tick={{ fontSize: 11, fill: "#78716c" }}
                tickFormatter={(v: number) => (v >= 1000000 ? `${v / 1000000}jt` : `${v / 1000}rb`)}
                width={50}
              />
              <Tooltip content={<CustomAreaTooltip />} />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: "12px", fontWeight: "600" }} />
              <Area
                type="monotone"
                dataKey="masuk"
                name="Kas Masuk (Omzet)"
                stroke="#16a34a"
                strokeWidth={3}
                fill="url(#colorMasuk)"
              />
              <Area
                type="monotone"
                dataKey="keluar"
                name="Kas Keluar (Operasional)"
                stroke="#dc2626"
                strokeWidth={2.5}
                fill="url(#colorKeluar)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Grid 2 Columns: Payment Breakdown & Status Distribution */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Payment Methods Donut Chart */}
        <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <PieIcon size={18} className="text-sage-700" />
              <h2 className="font-serif-display text-lg font-bold text-stone-900">
                Kontribusi Metode Pembayaran
              </h2>
            </div>
            <p className="text-xs text-stone-500">
              Distribusi omzet kasir berdasarkan metode transaksi (Tunai, QRIS, Transfer, Debit).
            </p>
          </div>

          <div className="mt-4 h-60 w-full flex items-center justify-center">
            {paymentData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentData}
                    dataKey="total"
                    nameKey="metode"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    cornerRadius={6}
                  >
                    {paymentData.map((p) => (
                      <Cell key={p.metode} fill={PAYMENT_COLORS[p.metode] ?? "#6b7280"} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v, name) => [rupiah(Number(v)), `Metode ${name}`]}
                    contentStyle={{ borderRadius: "16px", border: "1px solid #e7e5e4", fontSize: "12px", fontWeight: "bold" }}
                  />
                  <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: "11px", fontWeight: "600" }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-stone-400">Belum ada data pembayaran POS terproses.</p>
            )}
          </div>
        </div>

        {/* Booking Status Distribution Donut Chart */}
        <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 size={18} className="text-sage-700" />
              <h2 className="font-serif-display text-lg font-bold text-stone-900">
                Distribusi Status Booking
              </h2>
            </div>
            <p className="text-xs text-stone-500">
              Persentase booking Selesai, Baru, Dikonfirmasi, dan Batal.
            </p>
          </div>

          <div className="mt-4 h-60 w-full flex items-center justify-center">
            {byStatus.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={byStatus}
                    dataKey="jumlah"
                    nameKey="status"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    cornerRadius={6}
                  >
                    {byStatus.map((s) => (
                      <Cell key={s.status} fill={STATUS_COLORS[s.status] ?? "#78716c"} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v) => [`${v} Booking`, "Jumlah"]}
                    contentStyle={{ borderRadius: "16px", border: "1px solid #e7e5e4", fontSize: "12px", fontWeight: "bold" }}
                  />
                  <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: "11px", fontWeight: "600" }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-stone-400">Belum ada booking terdaftar.</p>
            )}
          </div>
        </div>
      </div>

      {/* 3. Top Perawatan & Produk Terlaris Horizontal Bar Chart */}
      <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4 mb-3">
          <div>
            <div className="flex items-center gap-2">
              <Award size={20} className="text-gold-500" />
              <h2 className="font-serif-display text-lg font-bold text-stone-900">
                Layanan &amp; Perawatan Terfavorit
              </h2>
            </div>
            <p className="text-xs text-stone-500">
              Top 5 perawatan salon dengan volume transaksi terbanyak.
            </p>
          </div>
        </div>

        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={top} layout="vertical" margin={{ top: 5, right: 30, left: 30, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tick={{ fontSize: 11, fill: "#78716c" }} allowDecimals={false} />
              <YAxis type="category" dataKey="layanan" tick={{ fontSize: 12, fill: "#1c1917", fontWeight: "600" }} width={160} />
              <Tooltip
                formatter={(v) => [`${v} Treatment`, "Total Treatment"]}
                contentStyle={{ borderRadius: "16px", border: "1px solid #e7e5e4", fontSize: "12px", fontWeight: "bold" }}
              />
              <Bar dataKey="jumlah" name="Total Treatment" fill="#466046" radius={[0, 10, 10, 0]} barSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
