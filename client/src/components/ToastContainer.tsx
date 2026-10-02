import React from 'react';
import type { ToastMessage } from '../hooks/useWatchParty';
import { Info, CheckCircle2, AlertTriangle, AlertCircle, X } from 'lucide-react';

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
      {toasts.map((toast) => {
        let icon = <Info size={16} className="text-blue-400" />;
        let borderColor = 'border-blue-500/30';
        let bgColor = 'bg-zinc-900/95';

        if (toast.type === 'success') {
          icon = <CheckCircle2 size={16} className="text-emerald-400" />;
          borderColor = 'border-emerald-500/30';
        } else if (toast.type === 'warning') {
          icon = <AlertTriangle size={16} className="text-amber-400" />;
          borderColor = 'border-amber-500/30';
        } else if (toast.type === 'error') {
          icon = <AlertCircle size={16} className="text-rose-400" />;
          borderColor = 'border-rose-500/30';
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-xl border ${borderColor} ${bgColor} text-white shadow-2xl backdrop-blur-md transition-all animate-slide-up`}
          >
            <div className="flex items-center gap-2.5">
              {icon}
              <span className="text-xs font-medium leading-snug">{toast.message}</span>
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              className="text-zinc-500 hover:text-white p-0.5 rounded transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
