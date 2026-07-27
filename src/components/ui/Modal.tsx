"use client";

import { useEffect, useId, type ReactNode } from "react";
import { IconX } from "./icons";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}

export function Modal({ open, onClose, title, children, footer }: ModalProps) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-steel-950/80 p-4 backdrop-blur-sm"
      // Mousedown (not click) so a drag-select ending outside doesn't dismiss.
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="surface-raised flex max-h-[85vh] w-full max-w-lg animate-fade-in flex-col"
      >
        <header className="flex items-center justify-between gap-4 border-b border-rivet/40 px-4 py-3">
          <h2 id={titleId} className="heading-stencil truncate text-sm text-bone">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 rounded-card p-1 text-bone-faint transition-colors hover:bg-steel-800 hover:text-bone"
          >
            <IconX className="h-4 w-4" />
          </button>
        </header>
        <div className="overflow-y-auto p-4">{children}</div>
        {footer !== undefined && (
          <footer className="flex items-center justify-end gap-2 border-t border-rivet/40 px-4 py-3">
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
}
