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
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
      {toasts.map((toast) => {
        let icon = <Info size={15} className="text-blue-400 shrink-0" />;
        let borderColor = 'border-blue-500/25';
        let bgColor = 'bg-zinc-900';

        if (toast.type === 'success') {
          icon = <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />;
          borderColor = 'border-emerald-500/25';
        } else if (toast.type === 'warning') {
          icon = <AlertTriangle size={15} className="text-amber-400 shrink-0" />;
          borderColor = 'border-amber-500/25';
        } else if (toast.type === 'error') {
          icon = <AlertCircle size={15} className="text-rose-400 shrink-0" />;
          borderColor = 'border-rose-500/25';
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-lg border ${borderColor} ${bgColor} text-white shadow-md transition-all animate-fade-in`}
          >
            <div className="flex items-center gap-2 min-w-0">
              {icon}
              <span className="text-xs font-medium leading-snug text-zinc-200">{toast.message}</span>
            </div>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              className="text-zinc-500 hover:text-white p-0.5 rounded transition-colors shrink-0"
            >
              <X size={13} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
