import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function rupiah(n?: number | null) {
  const val = typeof n === "number" && !isNaN(n) ? n : 0;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(val);
}

export const WIB_TZ = "Asia/Jakarta";

export function formatTanggal(d: Date | string) {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: WIB_TZ,
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(d));
}

export function formatTanggalSingkat(d: Date | string) {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: WIB_TZ,
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(d));
}
