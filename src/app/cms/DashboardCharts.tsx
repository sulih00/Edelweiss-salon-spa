"use client";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, BarChart, Bar, Legend,
} from "recharts";
import { rupiah } from "@/lib/utils";
import { TrendingUp, PieChart as PieIcon, BarChart3, Award } from "lucide-react";

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

function CustomAreaTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value?: number }>; label?: string }) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-2xl border border-stone-200/80 bg-white/95 p-3.5 shadow-xl text-xs space-y-1.5 backdrop-blur-md">
        <p className="font-bold text-stone-900 border-b border-stone-100 pb-1">{label}</p>
        <div className="flex items-center justify-between gap-4 text-emerald-700 font-semibold">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-emerald-500" /> Kas Masuk:
          </span>
          <span>{rupiah(Number(payload[0]?.value || 0))}</span>
        </div>
        {payload[1] && (
          <div className="flex items-center justify-between gap-4 text-rose-600 font-semibold">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-rose-500" /> Kas Keluar:
            </span>
            <span>{rupiah(Number(payload[1]?.value || 0))}</span>
          </div>
        )}
      </div>
    );
  }
  return null;
}

export default function DashboardCharts({ daily, byStatus, top, paymentData = [] }: DashboardChartsProps) {
  const totalOmzetPeriod = daily.reduce((acc, d) => acc + d.masuk, 0);
  const totalKeluarPeriod = daily.reduce((acc, d) => acc + d.keluar, 0);

  return (
    <div className="mt-4 space-y-4">
      {/* 1. Main Cash Flow Chart Header & Area Chart */}
      <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp size={18} className="text-sage-700" />
              <h2 className="font-serif-display text-lg font-bold text-stone-900">
                Arus Kas &amp; Omzet 14 Hari
              </h2>
            </div>
            <p className="text-xs text-stone-500">
              Perbandingan kas masuk vs pengeluaran operasional.
            </p>
          </div>

          {/* Quick Metrics Pills */}
          <div className="flex items-center gap-2 text-xs">
            <div className="rounded-xl bg-emerald-50 px-3 py-1 border border-emerald-200/80">
              <span className="text-stone-500">Masuk: </span>
              <b className="text-emerald-800">{rupiah(totalOmzetPeriod)}</b>
            </div>
            <div className="rounded-xl bg-rose-50 px-3 py-1 border border-rose-200/80">
              <span className="text-stone-500">Keluar: </span>
              <b className="text-rose-700">{rupiah(totalKeluarPeriod)}</b>
            </div>
          </div>
        </div>

        <div className="h-56 w-full pt-1">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={daily} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
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
              <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f4" />
              <XAxis dataKey="tgl" tick={{ fontSize: 10, fill: "#78716c" }} interval={1} />
              <YAxis
                tick={{ fontSize: 10, fill: "#78716c" }}
                tickFormatter={(v: number) => (v >= 1000000 ? `${v / 1000000}jt` : `${v / 1000}rb`)}
                width={45}
              />
              <Tooltip content={<CustomAreaTooltip />} />
              <Legend verticalAlign="top" height={28} wrapperStyle={{ fontSize: "11px", fontWeight: "600" }} />
              <Area
                type="monotone"
                dataKey="masuk"
                name="Kas Masuk"
                stroke="#16a34a"
                strokeWidth={2.5}
                fill="url(#colorMasuk)"
              />
              <Area
                type="monotone"
                dataKey="keluar"
                name="Kas Keluar"
                stroke="#dc2626"
                strokeWidth={2}
                fill="url(#colorKeluar)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Grid 3 Columns: Payment Breakdown, Status Distribution & Top Services */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Payment Methods Donut Chart */}
        <div className="rounded-3xl border border-stone-200 bg-white p-4 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <PieIcon size={16} className="text-sage-700" />
              <h2 className="font-serif-display text-base font-bold text-stone-900">
                Metode Pembayaran
              </h2>
            </div>
            <p className="text-[11px] text-stone-500">
              Distribusi omzet per channel
            </p>
          </div>

          <div className="mt-2 h-48 w-full flex items-center justify-center">
            {paymentData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentData}
                    dataKey="total"
                    nameKey="metode"
                    innerRadius={42}
                    outerRadius={68}
                    paddingAngle={3}
                    cornerRadius={5}
                  >
                    {paymentData.map((p) => (
                      <Cell key={p.metode} fill={PAYMENT_COLORS[p.metode] ?? "#6b7280"} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v, name) => [rupiah(Number(v)), `Metode ${name}`]}
                    contentStyle={{ borderRadius: "12px", border: "1px solid #e7e5e4", fontSize: "11px", fontWeight: "bold" }}
                  />
                  <Legend verticalAlign="bottom" height={28} wrapperStyle={{ fontSize: "10px", fontWeight: "600" }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-stone-400">Belum ada transaksi POS.</p>
            )}
          </div>
        </div>

        {/* Booking Status Distribution Donut Chart */}
        <div className="rounded-3xl border border-stone-200 bg-white p-4 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 size={16} className="text-sage-700" />
              <h2 className="font-serif-display text-base font-bold text-stone-900">
                Status Booking
              </h2>
            </div>
            <p className="text-[11px] text-stone-500">
              Perbandingan 30 hari terakhir
            </p>
          </div>

          <div className="mt-2 h-48 w-full flex items-center justify-center">
            {byStatus.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={byStatus}
                    dataKey="jumlah"
                    nameKey="status"
                    innerRadius={42}
                    outerRadius={68}
                    paddingAngle={3}
                    cornerRadius={5}
                  >
                    {byStatus.map((s) => (
                      <Cell key={s.status} fill={STATUS_COLORS[s.status] ?? "#78716c"} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v) => [`${v} Booking`, "Jumlah"]}
                    contentStyle={{ borderRadius: "12px", border: "1px solid #e7e5e4", fontSize: "11px", fontWeight: "bold" }}
                  />
                  <Legend verticalAlign="bottom" height={28} wrapperStyle={{ fontSize: "10px", fontWeight: "600" }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-stone-400">Belum ada booking.</p>
            )}
          </div>
        </div>

        {/* Top Perawatan & Produk Terlaris Horizontal Bar Chart */}
        <div className="rounded-3xl border border-stone-200 bg-white p-4 shadow-xs md:col-span-2 lg:col-span-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Award size={16} className="text-gold-500" />
              <h2 className="font-serif-display text-base font-bold text-stone-900">
                Layanan Terfavorit
              </h2>
            </div>
            <p className="text-[11px] text-stone-500">
              Top 5 perawatan paling banyak di-booking
            </p>
          </div>

          <div className="mt-2 h-48 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={top} layout="vertical" margin={{ top: 0, right: 15, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f4" />
                <XAxis type="number" tick={{ fontSize: 10, fill: "#78716c" }} allowDecimals={false} />
                <YAxis type="category" dataKey="layanan" tick={{ fontSize: 10, fill: "#1c1917", fontWeight: "600" }} width={100} />
                <Tooltip
                  formatter={(v) => [`${v} Treatment`, "Total"]}
                  contentStyle={{ borderRadius: "12px", border: "1px solid #e7e5e4", fontSize: "11px", fontWeight: "bold" }}
                />
                <Bar dataKey="jumlah" name="Total" fill="#466046" radius={[0, 8, 8, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
