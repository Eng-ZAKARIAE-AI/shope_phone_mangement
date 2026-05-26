import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Purge Entry'
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" id="confirm-modal-outer">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>

      {/* Frame */}
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-xl p-6 transition-all">
        
        {/* Close Button Pin */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full cursor-pointer transition-colors"
          id="confirm-close-btn"
        >
          <X size={16} />
        </button>

        {/* Contents */}
        <div className="flex items-start gap-4">
          <div className="p-3 bg-rose-50 dark:bg-rose-950/20 text-rose-500 rounded-xl shrink-0">
            <AlertTriangle size={22} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
              {title}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
              {description}
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-50 dark:border-slate-800/80">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold border border-slate-250 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 cursor-pointer transition-colors"
            id="confirm-cancel-btn"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-4 py-2 text-xs font-bold rounded-xl text-white bg-rose-600 hover:bg-rose-500 cursor-pointer transition-colors"
            id="confirm-submit-btn"
          >
            {confirmText}
          </button>
        </div>

      </div>
    </div>
  );
}
