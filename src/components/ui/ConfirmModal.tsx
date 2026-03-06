'use client';
import React from 'react';

type ConfirmModalProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmClassName?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmClassName = 'btn-primary',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl animate-slide-up">
        <div className="p-5 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">{title}</h2>
          <p className="text-sm text-slate-500 mt-1">{message}</p>
        </div>
        <div className="p-5 flex gap-3">
          <button
            onClick={onConfirm}
            className={`${confirmClassName} flex-1`}
            disabled={loading}
          >
            {loading ? 'Processing...' : confirmLabel}
          </button>
          <button
            onClick={onCancel}
            className="btn-secondary flex-1"
            disabled={loading}
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
