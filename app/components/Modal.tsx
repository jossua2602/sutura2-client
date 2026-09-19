import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth = 'md',
}: ModalProps) {
  const [mounted, setMounted] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  const maxWidthClass = {
    sm: 'md:max-w-sm',
    md: 'md:max-w-md',
    lg: 'md:max-w-lg',
    xl: 'md:max-w-xl',
    '2xl': 'md:max-w-2xl',
    full: 'md:max-w-[calc(100vw-2rem)]',
  }[maxWidth];

  const modalContent = (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center md:items-center md:p-4 animate-view"
    >
      {/* Backdrop (hidden on mobile, visible on desktop) */}
      <div
        className="fixed inset-0 bg-text-ink/40 transition-opacity opacity-0 md:opacity-100"
        aria-hidden="true"
        onClick={onClose}
      />

      {/* Modal Surface */}
      <div
        role="dialog"
        aria-modal="true"
        ref={overlayRef}
        className={`relative flex w-full flex-col bg-bg-surface border-border-line md:border md:rounded-lg ${maxWidthClass} h-[100dvh] md:h-auto md:max-h-[90vh]`}
      >
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 flex shrink-0 items-center justify-between border-b border-border-line bg-bg-surface px-4 py-3 md:px-5 md:py-4 md:rounded-t-lg">
          <h2 className="text-display text-lg font-semibold text-text-ink">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 shrink-0 place-items-center text-text-ink-muted transition-colors hover:bg-bg-sunken hover:text-text-ink"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-4 py-5 md:px-5">
          {children}
        </div>

        {/* Sticky Footer */}
        {footer && (
          <div className="sticky bottom-0 z-10 shrink-0 border-t border-border-line bg-bg-surface px-4 py-3 md:px-5 md:py-4 md:rounded-b-lg pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:pb-4">
            <div className="flex items-center justify-end gap-3 w-full">
              {footer}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
