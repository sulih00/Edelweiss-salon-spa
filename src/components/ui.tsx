import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-2xl border border-stone-200 bg-white p-5 shadow-sm", className)} {...props} />;
}

export function Btn({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "rounded-full bg-sage-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-sage-800 disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-sage-600 focus:ring-2 focus:ring-sage-100"
    />
  );
}

export function Label({ children, className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500", className)} {...props}>{children}</label>;
}
