"use client";

import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X, HelpCircle, Edit3 } from "lucide-react";
import { cn } from "@/lib/utils";

export type AlertType = "success" | "error" | "warning" | "info";

export interface ModalAlertOptions {
  title?: string;
  message: React.ReactNode;
  type?: AlertType | "danger";
  confirmText?: string;
  cancelText?: string;
  isConfirm?: boolean;
}

export interface PromptAlertOptions {
  title?: string;
  message: React.ReactNode;
  defaultValue?: string;
  placeholder?: string;
  inputType?: "text" | "number" | "password" | "email" | "textarea";
  confirmText?: string;
  cancelText?: string;
  required?: boolean;
  validate?: (value: string) => string | null | undefined;
}

export interface ToastItem {
  id: string;
  title?: string;
  message: React.ReactNode;
  type: AlertType;
  duration?: number;
}

interface AlertContextType {
  showAlert: (options: ModalAlertOptions | string) => Promise<boolean>;
  showConfirm: (options: ModalAlertOptions | string) => Promise<boolean>;
  showPrompt: (options: PromptAlertOptions | string) => Promise<string | null>;
  alert: (message: string, title?: string, type?: AlertType) => Promise<boolean>;
  confirm: (message: string, title?: string) => Promise<boolean>;
  prompt: (message: string, defaultValue?: string, title?: string) => Promise<string | null>;
  toast: {
    success: (message: string, title?: string, duration?: number) => string;
    error: (message: string, title?: string, duration?: number) => string;
    warning: (message: string, title?: string, duration?: number) => string;
    info: (message: string, title?: string, duration?: number) => string;
    show: (options: Omit<ToastItem, "id"> | string) => string;
    dismiss: (id: string) => void;
  };
}

const AlertContext = createContext<AlertContextType | null>(null);

export function AlertProvider({ children }: { children: React.ReactNode }) {
  // Modal Alert / Confirm state
  const [modal, setModal] = useState<{
    isOpen: boolean;
    options: ModalAlertOptions;
    resolve: (value: boolean) => void;
  } | null>(null);

  // Modal Prompt state (replaces window.prompt)
  const [promptState, setPromptState] = useState<{
    isOpen: boolean;
    options: PromptAlertOptions;
    inputValue: string;
    error?: string;
    resolve: (value: string | null) => void;
  } | null>(null);

  // Toasts state
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  // Show Alert Dialog (replaces window.alert)
  const showAlert = useCallback((options: ModalAlertOptions | string): Promise<boolean> => {
    return new Promise((resolve) => {
      const opts: ModalAlertOptions =
        typeof options === "string"
          ? { message: options, title: "Pemberitahuan", type: "info", isConfirm: false }
          : { title: "Pemberitahuan", type: "info", isConfirm: false, ...options };

      setModal({
        isOpen: true,
        options: opts,
        resolve,
      });
    });
  }, []);

  // Show Confirm Dialog (replaces window.confirm)
  const showConfirm = useCallback((options: ModalAlertOptions | string): Promise<boolean> => {
    return new Promise((resolve) => {
      const opts: ModalAlertOptions =
        typeof options === "string"
          ? { message: options, title: "Konfirmasi", type: "warning", isConfirm: true }
          : { title: "Konfirmasi", type: "warning", isConfirm: true, ...options };

      setModal({
        isOpen: true,
        options: opts,
        resolve,
      });
    });
  }, []);

  // Show Prompt Dialog (replaces window.prompt)
  const showPrompt = useCallback((options: PromptAlertOptions | string): Promise<string | null> => {
    return new Promise((resolve) => {
      const opts: PromptAlertOptions =
        typeof options === "string"
          ? { message: options, title: "Input Data" }
          : { title: "Input Data", ...options };

      setPromptState({
        isOpen: true,
        options: opts,
        inputValue: opts.defaultValue ?? "",
        resolve,
      });
    });
  }, []);

  // Short helpers
  const alertHelper = useCallback(
    (message: string, title = "Pemberitahuan", type: AlertType = "info") => {
      return showAlert({ message, title, type, isConfirm: false });
    },
    [showAlert]
  );

  const confirmHelper = useCallback(
    (message: string, title = "Konfirmasi Hapus / Tindakan") => {
      return showConfirm({ message, title, type: "warning", isConfirm: true });
    },
    [showConfirm]
  );

  const promptHelper = useCallback(
    (message: string, defaultValue = "", title = "Input Data") => {
      return showPrompt({ message, defaultValue, title });
    },
    [showPrompt]
  );

  // Close alert modal
  const handleModalClose = useCallback(
    (result: boolean) => {
      if (modal) {
        modal.resolve(result);
        setModal(null);
      }
    },
    [modal]
  );

  // Close prompt modal
  const handlePromptClose = useCallback(
    (result: string | null) => {
      if (promptState) {
        promptState.resolve(result);
        setPromptState(null);
      }
    },
    [promptState]
  );

  // Submit prompt form
  const handlePromptSubmit = useCallback(
    (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      if (!promptState) return;

      const val = promptState.inputValue;
      const opts = promptState.options;

      if (opts.required && !val.trim()) {
        setPromptState((prev) => (prev ? { ...prev, error: "Field ini tidak boleh kosong." } : null));
        return;
      }

      if (opts.validate) {
        const err = opts.validate(val);
        if (err) {
          setPromptState((prev) => (prev ? { ...prev, error: err } : null));
          return;
        }
      }

      handlePromptClose(val);
    },
    [promptState, handlePromptClose]
  );

  // Handle ESC or ENTER keyboard events for modal & prompt
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (modal?.isOpen) {
        if (e.key === "Escape") {
          handleModalClose(false);
        } else if (e.key === "Enter" && !modal.options.isConfirm) {
          handleModalClose(true);
        }
      } else if (promptState?.isOpen) {
        if (e.key === "Escape") {
          handlePromptClose(null);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [modal, promptState, handleModalClose, handlePromptClose]);

  // Toast handler
  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (options: Omit<ToastItem, "id"> | string): string => {
      const id = Math.random().toString(36).substring(2, 9);
      const toastItem: ToastItem =
        typeof options === "string"
          ? { id, message: options, type: "info", duration: 4000 }
          : { id, duration: 4000, ...options, type: options.type ?? "info" };

      setToasts((prev) => [...prev.slice(-4), toastItem]); // Keep max 5 toasts

      if (toastItem.duration && toastItem.duration > 0) {
        setTimeout(() => {
          dismissToast(id);
        }, toastItem.duration);
      }

      return id;
    },
    [dismissToast]
  );

  const toast = useMemo(
    () => ({
      success: (message: string, title?: string, duration?: number) =>
        showToast({ message, title, type: "success", duration }),
      error: (message: string, title?: string, duration?: number) =>
        showToast({ message, title, type: "error", duration }),
      warning: (message: string, title?: string, duration?: number) =>
        showToast({ message, title, type: "warning", duration }),
      info: (message: string, title?: string, duration?: number) =>
        showToast({ message, title, type: "info", duration }),
      show: showToast,
      dismiss: dismissToast,
    }),
    [showToast, dismissToast]
  );

  const contextValue = useMemo(
    () => ({
      showAlert,
      showConfirm,
      showPrompt,
      alert: alertHelper,
      confirm: confirmHelper,
      prompt: promptHelper,
      toast,
    }),
    [showAlert, showConfirm, showPrompt, alertHelper, confirmHelper, promptHelper, toast]
  );

  return (
    <AlertContext.Provider value={contextValue}>
      {children}

      {/* Modern Alert & Confirm Modal Dialog (replaces window.alert & window.confirm) */}
      <AnimatePresence>
        {modal?.isOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => handleModalClose(false)}
              className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs transition-opacity"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", duration: 0.35, bounce: 0.15 }}
              className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl bg-white p-6 shadow-2xl border border-stone-200"
            >
              {/* Top Accent Icon */}
              <div className="mb-4 flex items-center gap-3">
                <div
                  className={cn(
                    "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-inner",
                    modal.options.type === "success" && "bg-sage-100 text-sage-700",
                    (modal.options.type === "error" || modal.options.type === "danger") && "bg-rose-100 text-rose-600",
                    modal.options.type === "warning" && "bg-amber-100 text-amber-600",
                    (modal.options.type === "info" || !modal.options.type) && "bg-cream-200 text-gold-600"
                  )}
                >
                  {modal.options.type === "success" && <CheckCircle2 className="h-6 w-6" />}
                  {(modal.options.type === "error" || modal.options.type === "danger") && <AlertCircle className="h-6 w-6" />}
                  {modal.options.type === "warning" && <AlertTriangle className="h-6 w-6" />}
                  {(modal.options.type === "info" || !modal.options.type) && <HelpCircle className="h-6 w-6" />}
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold text-stone-900">
                    {modal.options.title ?? (modal.options.isConfirm ? "Konfirmasi" : "Notifikasi")}
                  </h3>
                  <p className="text-xs text-stone-500 uppercase tracking-wider font-semibold">
                    Edelweiss Salon & Spa
                  </p>
                </div>
              </div>

              {/* Message */}
              <div className="my-4 text-sm leading-relaxed text-stone-600 bg-stone-50/70 p-4 rounded-2xl border border-stone-100">
                {modal.options.message}
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex items-center justify-end gap-3">
                {modal.options.isConfirm && (
                  <button
                    type="button"
                    onClick={() => handleModalClose(false)}
                    className="rounded-full border border-stone-300 bg-white px-5 py-2.5 text-xs font-semibold text-stone-700 transition-all hover:bg-stone-100 hover:border-stone-400 active:scale-97 cursor-pointer"
                  >
                    {modal.options.cancelText ?? "Batal"}
                  </button>
                )}
                <button
                  type="button"
                  autoFocus
                  onClick={() => handleModalClose(true)}
                  className={cn(
                    "rounded-full px-6 py-2.5 text-xs font-semibold text-white shadow-md transition-all active:scale-97 cursor-pointer",
                    modal.options.type === "error" || modal.options.type === "danger"
                      ? "bg-rose-600 hover:bg-rose-700 shadow-rose-200"
                      : modal.options.type === "warning"
                      ? "bg-amber-600 hover:bg-amber-700 shadow-amber-200"
                      : "bg-sage-700 hover:bg-sage-800 shadow-sage-200"
                  )}
                >
                  {modal.options.confirmText ?? (modal.options.isConfirm ? "Ya, Lanjutkan" : "Mengerti")}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modern Custom Prompt Dialog Modal (replaces window.prompt) */}
      <AnimatePresence>
        {promptState?.isOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => handlePromptClose(null)}
              className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs transition-opacity"
            />

            {/* Prompt Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", duration: 0.35, bounce: 0.15 }}
              className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl bg-white p-6 shadow-2xl border border-stone-200"
            >
              <form onSubmit={handlePromptSubmit}>
                {/* Header */}
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sage-100 text-sage-700 shadow-inner">
                    <Edit3 className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-serif text-lg font-bold text-stone-900">
                      {promptState.options.title ?? "Input Data"}
                    </h3>
                    <p className="text-xs text-stone-500 uppercase tracking-wider font-semibold">
                      Edelweiss Salon & Spa
                    </p>
                  </div>
                </div>

                {/* Message */}
                <div className="my-3 text-sm leading-relaxed text-stone-700 font-medium">
                  {promptState.options.message}
                </div>

                {/* Input Field */}
                <div className="my-4">
                  {promptState.options.inputType === "textarea" ? (
                    <textarea
                      autoFocus
                      rows={3}
                      value={promptState.inputValue}
                      placeholder={promptState.options.placeholder ?? "Masukkan text..."}
                      onChange={(e) =>
                        setPromptState((prev) =>
                          prev ? { ...prev, inputValue: e.target.value, error: undefined } : null
                        )
                      }
                      className={cn(
                        "w-full rounded-2xl border bg-stone-50/50 p-3.5 text-sm text-stone-900 outline-none transition-all focus:border-sage-600 focus:bg-white focus:ring-2 focus:ring-sage-100",
                        promptState.error ? "border-rose-400 focus:border-rose-500 focus:ring-rose-100" : "border-stone-300"
                      )}
                    />
                  ) : (
                    <input
                      autoFocus
                      type={promptState.options.inputType ?? "text"}
                      value={promptState.inputValue}
                      placeholder={promptState.options.placeholder ?? "Masukkan nilai..."}
                      onChange={(e) =>
                        setPromptState((prev) =>
                          prev ? { ...prev, inputValue: e.target.value, error: undefined } : null
                        )
                      }
                      className={cn(
                        "w-full rounded-xl border bg-stone-50/50 px-4 py-2.5 text-sm text-stone-900 outline-none transition-all focus:border-sage-600 focus:bg-white focus:ring-2 focus:ring-sage-100",
                        promptState.error ? "border-rose-400 focus:border-rose-500 focus:ring-rose-100" : "border-stone-300"
                      )}
                    />
                  )}

                  {/* Validation Error Message */}
                  {promptState.error && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-1.5 text-xs font-medium text-rose-600 flex items-center gap-1"
                    >
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                      {promptState.error}
                    </motion.p>
                  )}
                </div>

                {/* Actions */}
                <div className="mt-6 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => handlePromptClose(null)}
                    className="rounded-full border border-stone-300 bg-white px-5 py-2.5 text-xs font-semibold text-stone-700 transition-all hover:bg-stone-100 hover:border-stone-400 active:scale-97 cursor-pointer"
                  >
                    {promptState.options.cancelText ?? "Batal"}
                  </button>
                  <button
                    type="submit"
                    className="rounded-full bg-sage-700 px-6 py-2.5 text-xs font-semibold text-white shadow-md shadow-sage-200 transition-all hover:bg-sage-800 active:scale-97 cursor-pointer"
                  >
                    {promptState.options.confirmText ?? "Simpan"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Toast Notification Container */}
      <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.95 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className={cn(
                "pointer-events-auto relative flex items-start gap-3 rounded-2xl p-4 shadow-xl border backdrop-blur-md transition-all overflow-hidden",
                t.type === "success" && "bg-white/95 border-sage-200 text-stone-800",
                t.type === "error" && "bg-white/95 border-rose-200 text-stone-800",
                t.type === "warning" && "bg-white/95 border-amber-200 text-stone-800",
                t.type === "info" && "bg-white/95 border-cream-200 text-stone-800"
              )}
            >
              {/* Icon */}
              <div className="pt-0.5 shrink-0">
                {t.type === "success" && <CheckCircle2 className="h-5 w-5 text-sage-600" />}
                {t.type === "error" && <AlertCircle className="h-5 w-5 text-rose-600" />}
                {t.type === "warning" && <AlertTriangle className="h-5 w-5 text-amber-500" />}
                {t.type === "info" && <Info className="h-5 w-5 text-gold-600" />}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pr-1">
                {t.title && <h5 className="font-semibold text-xs text-stone-900 leading-tight mb-0.5">{t.title}</h5>}
                <div className="text-xs text-stone-600 leading-normal">{t.message}</div>
              </div>

              {/* Dismiss Button */}
              <button
                type="button"
                onClick={() => dismissToast(t.id)}
                className="shrink-0 text-stone-400 hover:text-stone-600 p-0.5 rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Progress Bar timer */}
              {t.duration && t.duration > 0 && (
                <motion.div
                  initial={{ width: "100%" }}
                  animate={{ width: "0%" }}
                  transition={{ duration: t.duration / 1000, ease: "linear" }}
                  className={cn(
                    "absolute bottom-0 left-0 right-0 h-1",
                    t.type === "success" && "bg-sage-600",
                    t.type === "error" && "bg-rose-500",
                    t.type === "warning" && "bg-amber-500",
                    t.type === "info" && "bg-gold-500"
                  )}
                />
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </AlertContext.Provider>
  );
}

export function useAlert() {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error("useAlert must be used within an AlertProvider");
  }
  return context;
}
