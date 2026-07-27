"use client";

import type { ReactNode } from "react";
import { Button } from "./Button";
import { Modal } from "./Modal";
import { IconWarning } from "./icons";

export interface ConfirmDialogProps {
  open: boolean;
  title: ReactNode;
  body?: ReactNode;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel = "Confirm",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      footer={
        <>
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-3">
        <IconWarning className="mt-0.5 h-5 w-5 shrink-0 text-blood" />
        <div className="text-sm text-bone-soft">
          {body ?? "This action cannot be undone."}
        </div>
      </div>
    </Modal>
  );
}
