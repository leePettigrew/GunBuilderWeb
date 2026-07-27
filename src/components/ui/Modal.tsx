"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { IconX } from "./icons";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}

// Module-level modal stack so stacked modals (e.g. import → confirm on
// /rules) cooperate: the body scroll lock is reference-counted and ESC only
// dismisses the top-most dialog.
const modalStack: symbol[] = [];
let savedBodyOverflow = "";

export function Modal({ open, onClose, title, children, footer }: ModalProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const token = Symbol("modal");
    modalStack.push(token);
    if (modalStack.length === 1) {
      savedBodyOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    }

    const previouslyFocused = document.activeElement;
    panelRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && modalStack[modalStack.length - 1] === token) onClose();
    };
    window.addEventListener("keydown", onKey);

    return () => {
      window.removeEventListener("keydown", onKey);
      const index = modalStack.indexOf(token);
      if (index !== -1) modalStack.splice(index, 1);
      if (modalStack.length === 0) document.body.style.overflow = savedBodyOverflow;
      if (previouslyFocused instanceof HTMLElement && previouslyFocused.isConnected) {
        previouslyFocused.focus();
      }
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
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="surface-raised flex max-h-[85vh] w-full max-w-lg animate-fade-in flex-col outline-none"
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
