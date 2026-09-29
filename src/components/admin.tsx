"use client";
import { useEffect } from "react";
import { X, Plus, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

/* ---------- Modal standar admin ---------- */
export function Modal({
  open,
  onClose,
  title,
  desc,
  children,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  desc?: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const fn = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", fn);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", fn);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-sage-950/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className={cn(
          "animate-bloom relative max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl",
          wide ? "sm:max-w-2xl" : "sm:max-w-lg"
        )}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="font-serif-display text-xl font-bold text-sage-900">{title}</h3>
            {desc && <p className="mt-0.5 text-sm text-stone-500">{desc}</p>}
          </div>
          <button onClick={onClose} className="rounded-full bg-stone-100 p-2 text-stone-500 transition hover:bg-stone-200" aria-label="Tutup">
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ---------- Header halaman ala admin template ---------- */
export function PageHeader({
  title,
  desc,
  action,
}: {
  title: string;
  desc?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-stone-900">{title}</h1>
        {desc && <p className="mt-1 text-sm text-stone-500">{desc}</p>}
      </div>
      {action}
    </div>
  );
}

export function AddButton({ onClick, label = "Tambah" }: { onClick: () => void; label?: string }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 rounded-xl bg-sage-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sage-800"
    >
      <Plus size={16} /> {label}
    </button>
  );
}

/* ---------- Kartu statistik ---------- */
export function Stat({
  icon,
  label,
  value,
  sub,
  tone = "sage",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  tone?: "sage" | "gold" | "green" | "red";
}) {
  const tones: Record<string, string> = {
    sage: "bg-sage-700",
    gold: "bg-gold-500",
    green: "bg-green-600",
    red: "bg-red-500",
  };
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-stone-200/70 bg-white p-4 shadow-sm">
      <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white", tones[tone])}>{icon}</span>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-stone-400">{label}</p>
        <p className="truncate text-lg font-bold text-stone-900">{value}</p>
        {sub && <p className="truncate text-xs text-stone-400">{sub}</p>}
      </div>
    </div>
  );
}

/* ---------- Tabel ala admin template ---------- */
export function TableShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-stone-200/70 bg-white shadow-sm">
      <table className="w-full min-w-[640px] text-left text-sm">{children}</table>
    </div>
  );
}

export function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <th className={cn("border-b border-stone-200 bg-stone-50 px-4 py-3 text-xs font-bold uppercase tracking-wide text-stone-500", className)}>
      {children}
    </th>
  );
}

export function Td({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <td className={cn("border-b border-stone-100 px-4 py-3 align-middle last:border-0", className)}>{children}</td>;
}

export function Badge({ tone = "sage", children }: { tone?: "sage" | "gold" | "green" | "red" | "stone"; children: React.ReactNode }) {
  const tones: Record<string, string> = {
    sage: "bg-sage-50 text-sage-700",
    gold: "bg-gold-400/15 text-gold-600",
    green: "bg-green-50 text-green-700",
    red: "bg-red-50 text-red-600",
    stone: "bg-stone-100 text-stone-500",
  };
  return <span className={cn("inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold", tones[tone])}>{children}</span>;
}

export function RowBtn({
  children,
  onClick,
  tone = "default",
}: {
  children: React.ReactNode;
  onClick: () => void;
  tone?: "default" | "danger" | "primary" | "green";
}) {
  const tones: Record<string, string> = {
    default: "border-stone-200 text-stone-600 hover:border-sage-600 hover:text-sage-700",
    danger: "border-red-200 text-red-600 hover:bg-red-50",
    primary: "bg-sage-700 text-white hover:bg-sage-800 border-transparent",
    green: "bg-green-600 text-white hover:bg-green-700 border-transparent",
  };
  return (
    <button onClick={onClick} className={cn("whitespace-nowrap rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition", tones[tone])}>
      {children}
    </button>
  );
}

export function Empty({ text = "Belum ada data." }: { text?: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-stone-300 bg-white px-4 py-10 text-center">
      <Inbox size={28} className="text-stone-300" />
      <p className="text-sm text-stone-400">{text}</p>
    </div>
  );
}

/* ---------- Saklar tampil / tidak tampil di website ---------- */
export function Switch({ on, onClick, label }: { on: boolean; onClick: () => void; label?: string }) {
  return (
    <button
      onClick={onClick}
      title={label ?? (on ? "Sembunyikan dari website" : "Tampilkan di website")}
      className={cn(
        "relative h-6 w-11 shrink-0 rounded-full transition-colors",
        on ? "bg-green-500" : "bg-stone-300"
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all",
          on ? "left-[22px]" : "left-0.5"
        )}
      />
    </button>
  );
}

/* ---------- Tab filter status ---------- */
export function FilterTabs<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string; count?: number }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5 rounded-2xl border border-stone-200/70 bg-white p-1.5 shadow-sm">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded-xl px-3.5 py-1.5 text-xs font-semibold transition",
            value === o.value ? "bg-sage-700 text-white shadow" : "text-stone-500 hover:bg-stone-100"
          )}
        >
          {o.label}
          {o.count != null && <span className={cn("ml-1.5 rounded-full px-1.5", value === o.value ? "bg-white/20" : "bg-stone-100")}>{o.count}</span>}
        </button>
      ))}
    </div>
  );
}

/* ---------- Pagination Component ---------- */
export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  pageSize = 10,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  pageSize?: number;
}) {
  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = totalItems ? Math.min(currentPage * pageSize, totalItems) : currentPage * pageSize;

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-stone-200/70 bg-white p-4 shadow-sm print:hidden">
      <div className="text-xs font-medium text-stone-500">
        {totalItems != null ? (
          <>
            Menampilkan <span className="font-bold text-stone-800">{startItem}</span>–<span className="font-bold text-stone-800">{endItem}</span> dari <span className="font-bold text-stone-800">{totalItems}</span> data
          </>
        ) : (
          <>
            Halaman <span className="font-bold text-stone-800">{currentPage}</span> dari <span className="font-bold text-stone-800">{totalPages}</span>
          </>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="flex items-center justify-center rounded-xl border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 transition hover:bg-stone-100 disabled:opacity-40 disabled:hover:bg-white"
        >
          ← Prev
        </button>

        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
          .map((p, idx, arr) => {
            const prev = arr[idx - 1];
            return (
              <span key={p} className="flex items-center">
                {prev && p - prev > 1 && <span className="px-1 text-xs text-stone-400">...</span>}
                <button
                  type="button"
                  onClick={() => onPageChange(p)}
                  className={`flex h-8 w-8 items-center justify-center rounded-xl text-xs font-bold transition ${
                    currentPage === p
                      ? "bg-sage-900 text-white shadow-sm"
                      : "border border-stone-200 bg-white text-stone-600 hover:bg-stone-100"
                  }`}
                >
                  {p}
                </button>
              </span>
            );
          })}

        <button
          type="button"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="flex items-center justify-center rounded-xl border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 transition hover:bg-stone-100 disabled:opacity-40 disabled:hover:bg-white"
        >
          Next →
        </button>
      </div>
    </div>
  );
}

