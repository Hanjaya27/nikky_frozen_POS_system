import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, LogOut, Trash2 } from "lucide-react";

const variantConfig = {
  danger: {
    icon: LogOut,
    iconBg: "bg-[#C80503]/10",
    iconColor: "text-[#C80503]",
    confirmBg: "bg-[#C80503] hover:bg-[#A80402] active:bg-[#8B0301]",
    confirmText: "text-white",
  },
  warning: {
    icon: AlertTriangle,
    iconBg: "bg-amber-50",
    iconColor: "text-amber-600",
    confirmBg: "bg-amber-600 hover:bg-amber-700 active:bg-amber-800",
    confirmText: "text-white",
  },
  default: {
    icon: AlertTriangle,
    iconBg: "bg-[#FFF6EA]",
    iconColor: "text-[#7A6258]",
    confirmBg: "bg-[#C80503] hover:bg-[#A80402] active:bg-[#8B0301]",
    confirmText: "text-white",
  },
};

export default function ConfirmModal({
  open,
  title = "Konfirmasi",
  message = "Apakah Anda yakin?",
  confirmText = "Ya",
  cancelText = "Batal",
  variant = "danger",
  loading = false,
  onConfirm,
  onCancel,
}) {
  const confirmRef = useRef(null);
  const config = variantConfig[variant] || variantConfig.danger;
  const Icon = config.icon;

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onCancel?.();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    confirmRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onCancel]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
        onClick={onCancel}
      />

      <div
        className={`relative w-full max-w-sm transform rounded-2xl border border-[#EBCDB8] bg-[#FFFDF8] p-6 shadow-2xl shadow-black/20 transition-all duration-300 ${
          open ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
      >
        <div className="flex flex-col items-center text-center">
          <div
            className={`mb-4 flex h-14 w-14 items-center justify-center rounded-full ${config.iconBg}`}
          >
            <Icon className={`h-7 w-7 ${config.iconColor}`} strokeWidth={2.2} />
          </div>

          <h2
            id="confirm-modal-title"
            className="text-lg font-bold text-[#2A1712]"
          >
            {title}
          </h2>

          <p className="mt-2 text-sm leading-relaxed text-[#7A6258]">
            {message}
          </p>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 rounded-xl border border-[#EBCDB8] bg-[#FFF6EA] px-4 py-2.5 text-sm font-bold text-[#7A6258] transition hover:bg-[#EBCDB8] hover:text-[#2A1712] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {cancelText}
          </button>

          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${config.confirmBg} ${config.confirmText}`}
          >
            {loading ? "Memproses..." : confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
