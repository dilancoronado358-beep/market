import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { clsx } from 'clsx';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | 'full';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = '2xl',
}) => {
  // Manejo de tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthStyles = {
    sm: 'max-w-xl w-full',
    md: 'max-w-3xl sm:w-[720px] w-full',
    lg: 'max-w-5xl sm:w-[90vw] w-full',
    xl: 'max-w-6xl sm:w-[94vw] w-full',
    '2xl': 'max-w-[94vw] w-[94vw]',
    '3xl': 'max-w-[95vw] w-[95vw]',
    '4xl': 'max-w-[96vw] w-[96vw]',
    '5xl': 'max-w-[97vw] w-[97vw]',
    '6xl': 'max-w-[98vw] w-[98vw]',
    '7xl': 'max-w-[98vw] w-[98vw]',
    full: 'max-w-[99vw] w-[99vw]',
  };

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-2 sm:p-4 md:p-6">
      {/* Backdrop con desenfoque */}
      <div
        className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm transition-opacity animate-fade-in"
        onClick={onClose}
      />

      <div
        className={clsx(
          'relative z-10 rounded-2xl bg-white dark:bg-slate-900 text-left shadow-2xl transition-all w-full border border-slate-200 dark:border-slate-800 animate-slide-up flex flex-col max-h-[calc(100vh-1rem)] sm:max-h-[calc(100vh-3rem)] my-auto overflow-hidden',
          maxWidthStyles[maxWidth]
        )}
      >
        {/* Header - Pinned Top */}
        <div className="flex items-start justify-between px-4 py-3.5 sm:px-8 sm:py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/80 shrink-0">
          <div>
            <h3 className="text-base sm:text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              {title}
            </h3>
            {subtitle && (
              <p className="mt-0.5 sm:mt-1 text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
                {subtitle}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors focus:outline-none"
            title="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body - Scrollable with min-h-0 so flexbox shrinks properly */}
        <div className="px-4 py-4 sm:px-8 sm:py-6 overflow-y-auto flex-1 min-h-0 text-slate-700 dark:text-slate-200">
          {children}
        </div>

        {/* Footer - Pinned Bottom */}
        {footer && (
          <div className="px-4 py-3 sm:px-8 sm:py-4 bg-slate-50 dark:bg-slate-850/90 border-t border-slate-100 dark:border-slate-800 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 shrink-0 [&>button]:w-full [&>button]:sm:w-auto">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};
