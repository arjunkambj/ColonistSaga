"use client";

import { AlertDialog, Button } from "@heroui/react";

interface ConfirmationDialogProps {
  busy: boolean;
  confirmLabel: string;
  description: string;
  onCancel(): void;
  onConfirm(): void;
  title: string;
}

export function ConfirmationDialog({
  busy,
  confirmLabel,
  description,
  onCancel,
  onConfirm,
  title,
}: ConfirmationDialogProps) {
  return (
    <AlertDialog>
      <AlertDialog.Backdrop
        className="confirmation-dialog"
        isDismissable={!busy}
        isKeyboardDismissDisabled={busy}
        isOpen
        onOpenChange={(isOpen) => {
          if (!isOpen && !busy) {
            onCancel();
          }
        }}
      >
        <AlertDialog.Container>
          <AlertDialog.Dialog className="confirmation-dialog-card">
            <AlertDialog.Header className="confirmation-dialog-header">
              <div>
                <p className="eyebrow">Please Confirm</p>
                <AlertDialog.Heading>{title}</AlertDialog.Heading>
              </div>
            </AlertDialog.Header>
            <AlertDialog.Body className="confirmation-dialog-body">{description}</AlertDialog.Body>
            <AlertDialog.Footer className="confirmation-dialog-footer">
              <Button
                className="button-secondary"
                isDisabled={busy}
                onPress={onCancel}
                variant="secondary"
              >
                Go Back
              </Button>
              <Button
                className="button-danger"
                isDisabled={busy}
                isPending={busy}
                onPress={onConfirm}
                variant="danger"
              >
                {busy ? "Working…" : confirmLabel}
              </Button>
            </AlertDialog.Footer>
          </AlertDialog.Dialog>
        </AlertDialog.Container>
      </AlertDialog.Backdrop>
    </AlertDialog>
  );
}
