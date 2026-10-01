"use client";

import React from "react";
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export type AlertType = "success" | "error" | "warning" | "info";

export interface AlertProps {
  type?: AlertType;
  title?: string;
  message?: React.ReactNode;
  children?: React.ReactNode;
  onClose?: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
  variant?: "soft" | "filled" | "bordered";
  className?: string;
  icon?: React.ReactNode;
}

const alertStyles: Record<
  AlertType,
  {
    soft: string;
    filled: string;
    bordered: string;
    icon: React.ReactNode;
    titleColor: string;
  }
> = {
  success: {
    soft: "bg-sage-50 text-sage-900 border-sage-200/80",
    filled: "bg-sage-700 text-white border-sage-700",
    bordered: "bg-white text-sage-900 border-sage-500",
    icon: <CheckCircle2 className="h-5 w-5 text-sage-600 shrink-0" />,
    titleColor: "text-sage-900 font-semibold",
  },
  error: {
    soft: "bg-rose-50 text-rose-950 border-rose-200",
    filled: "bg-rose-600 text-white border-rose-600",
    bordered: "bg-white text-rose-900 border-rose-400",
    icon: <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />,
    titleColor: "text-rose-950 font-semibold",
  },
  warning: {
    soft: "bg-amber-50 text-amber-950 border-amber-200",
    filled: "bg-amber-600 text-white border-amber-600",
    bordered: "bg-white text-amber-900 border-amber-400",
    icon: <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />,
    titleColor: "text-amber-950 font-semibold",
  },
  info: {
    soft: "bg-cream-100 text-stone-800 border-gold-300/60",
    filled: "bg-stone-800 text-white border-stone-800",
    bordered: "bg-white text-stone-900 border-stone-300",
    icon: <Info className="h-5 w-5 text-gold-600 shrink-0" />,
    titleColor: "text-stone-900 font-semibold",
  },
};

export function Alert({
  type = "info",
  title,
  message,
  children,
  onClose,
  action,
  variant = "soft",
  className,
  icon: customIcon,
}: AlertProps) {
  const styleConfig = alertStyles[type] || alertStyles.info;
  const content = message || children;
  const iconToDisplay =
    customIcon ||
    (variant === "filled"
      ? React.cloneElement(styleConfig.icon as React.ReactElement<{ className?: string }>, {
          className: "h-5 w-5 text-white shrink-0",
        })
      : styleConfig.icon);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -6, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -6, scale: 0.98 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className={cn(
          "relative flex w-full items-start gap-3 rounded-2xl border p-4 text-sm shadow-xs transition-all",
          styleConfig[variant],
          className
        )}
        role="alert"
      >
        <div className="pt-0.5">{iconToDisplay}</div>

        <div className="flex-1 min-w-0 pr-2">
          {title && <h5 className={cn("mb-0.5 leading-tight text-sm", variant === "filled" ? "text-white font-semibold" : styleConfig.titleColor)}>{title}</h5>}
          {content && <div className={cn("text-xs leading-relaxed opacity-90", variant === "filled" ? "text-stone-100" : "text-stone-700")}>{content}</div>}
          
          {action && (
            <div className="mt-2.5">
              <button
                type="button"
                onClick={action.onClick}
                className={cn(
                  "rounded-lg px-3 py-1 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1",
                  variant === "filled"
                    ? "bg-white/20 text-white hover:bg-white/30"
                    : "bg-white text-stone-800 border border-stone-200 hover:bg-stone-50 shadow-2xs"
                )}
              >
                {action.label}
              </button>
            </div>
          )}
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className={cn(
              "shrink-0 rounded-lg p-1 transition-colors hover:bg-black/5 focus:outline-none",
              variant === "filled" ? "text-white/80 hover:bg-white/20" : "text-stone-400 hover:text-stone-600"
            )}
            aria-label="Tutup alert"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
