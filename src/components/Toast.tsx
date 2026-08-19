import React from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { ToastMessage } from "../types";

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const bgBorder =
          toast.type === "success"
            ? "bg-slate-900/90 border-emerald-500/40 text-emerald-300"
            : toast.type === "error"
            ? "bg-slate-900/90 border-rose-500/40 text-rose-300"
            : toast.type === "warning"
            ? "bg-slate-900/90 border-amber-500/40 text-amber-300"
            : "bg-slate-900/90 border-cyan-500/40 text-cyan-300";

        const Icon =
          toast.type === "success"
            ? CheckCircle2
            : toast.type === "error" || toast.type === "warning"
            ? AlertCircle
            : Info;

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 p-3.5 rounded-xl border backdrop-blur-md shadow-2xl shadow-black/80 transition-all duration-300 animate-slide-up ${bgBorder}`}
          >
            <div className="flex items-center gap-2.5 text-xs font-medium">
              <Icon className="w-4 h-4 shrink-0" />
              <span>{toast.text}</span>
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              className="p-1 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
