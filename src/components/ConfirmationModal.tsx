import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangleIcon, TrashIcon, CheckCircleIcon, XIcon, ShieldCheckIcon } from './lib/contexts/Icons';

export interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  type?: 'delete' | 'status_change' | 'warning' | 'default';
  confirmText?: string;
  cancelText?: string;
  itemDetails?: { label: string; value: string }[];
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = 'default',
  confirmText,
  cancelText = 'إلغاء',
  itemDetails = [],
}) => {
  const [isExecuting, setIsExecuting] = useState(false);

  if (!isOpen) return null;

  const handleConfirmAction = async () => {
    try {
      setIsExecuting(true);
      await onConfirm();
    } catch (err) {
      console.error('Confirmation action error:', err);
    } finally {
      setIsExecuting(false);
      onClose();
    }
  };

  const getHeaderIcon = () => {
    switch (type) {
      case 'delete':
        return (
          <div className="w-16 h-16 rounded-3xl bg-rose-500/10 text-rose-500 border-2 border-rose-500/30 flex items-center justify-center text-2xl shadow-lg shadow-rose-500/10 animate-bounce">
            <TrashIcon className="w-8 h-8" />
          </div>
        );
      case 'status_change':
        return (
          <div className="w-16 h-16 rounded-3xl bg-amber-500/10 text-amber-500 border-2 border-amber-500/30 flex items-center justify-center text-2xl shadow-lg shadow-amber-500/10">
            <ShieldCheckIcon className="w-8 h-8" />
          </div>
        );
      case 'warning':
        return (
          <div className="w-16 h-16 rounded-3xl bg-yellow-500/10 text-yellow-500 border-2 border-yellow-500/30 flex items-center justify-center text-2xl shadow-lg shadow-yellow-500/10">
            <AlertTriangleIcon className="w-8 h-8" />
          </div>
        );
      default:
        return (
          <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 text-emerald-500 border-2 border-emerald-500/30 flex items-center justify-center text-2xl shadow-lg shadow-emerald-500/10">
            <CheckCircleIcon className="w-8 h-8" />
          </div>
        );
    }
  };

  const defaultConfirmText = type === 'delete' ? 'تأكيد الحذف النهائي' : 'تأكيد الإجراء';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 font-tajawal dir-rtl">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-[0_25px_60px_rgba(0,0,0,0.3)] border border-gray-100 overflow-hidden z-10"
        >
          {/* Top Decorative Banner */}
          <div
            className={`h-3 w-full ${
              type === 'delete'
                ? 'bg-gradient-to-r from-rose-500 via-red-600 to-rose-500'
                : type === 'status_change'
                ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500'
                : 'bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500'
            }`}
          />

          {/* Close X Button */}
          <button
            onClick={onClose}
            className="absolute top-6 left-6 p-2.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <XIcon className="w-5 h-5" />
          </button>

          <div className="p-8 md:p-10 space-y-6 text-center">
            {/* Icon Header */}
            <div className="flex justify-center">{getHeaderIcon()}</div>

            {/* Title & Description */}
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">{title}</h3>
              <p className="text-sm font-bold text-slate-500 leading-relaxed max-w-md mx-auto">
                {message}
              </p>
            </div>

            {/* Item Details Box (if provided) */}
            {itemDetails.length > 0 && (
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2 text-right">
                {itemDetails.map((detail, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-400">{detail.label}:</span>
                    <span className="font-black text-slate-800">{detail.value}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Warning callout for deletes */}
            {type === 'delete' && (
              <div className="p-3 bg-rose-50 rounded-2xl border border-rose-200/60 text-xs font-bold text-rose-700 flex items-center justify-center gap-2">
                <span>⚠️</span>
                <span>هذا الإجراء نهائي ولا يمكن التراجع عنه بعد تأكيده.</span>
              </div>
            )}

            {/* Actions Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                disabled={isExecuting}
                onClick={handleConfirmAction}
                className={`w-full sm:w-auto flex-1 py-4 px-6 rounded-2xl font-black text-sm shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${
                  type === 'delete'
                    ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-500/25'
                    : type === 'status_change'
                    ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-amber-500/25'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/25'
                }`}
              >
                {isExecuting ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></span>
                    <span>جاري التنفيذ...</span>
                  </>
                ) : (
                  <span>{confirmText || defaultConfirmText}</span>
                )}
              </button>

              <button
                type="button"
                disabled={isExecuting}
                onClick={onClose}
                className="w-full sm:w-auto flex-1 py-4 px-6 rounded-2xl font-black text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all active:scale-95"
              >
                {cancelText}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
