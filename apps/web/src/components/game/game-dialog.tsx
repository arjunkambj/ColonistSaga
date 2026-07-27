"use client";

import { Button, Modal } from "@heroui/react";
import type { ReactNode } from "react";

import { liquidGlassClassName } from "@/components/ui/liquid-glass";

import styles from "./game-dialog.module.css";

interface GameDialogProps {
  ariaLabel: string;
  bodyClassName?: string;
  children: ReactNode;
  dialogClassName?: string;
  footer: ReactNode;
  footerClassName?: string;
  id?: string;
  isBusy?: boolean;
  kicker: string;
  onClose(): void;
  title: string;
}

function joinClassNames(...classNames: (string | undefined)[]) {
  return classNames.filter(Boolean).join(" ");
}

export function GameDialog({
  ariaLabel,
  bodyClassName,
  children,
  dialogClassName,
  footer,
  footerClassName,
  id,
  isBusy = false,
  kicker,
  onClose,
  title,
}: GameDialogProps) {
  return (
    <Modal>
      <Modal.Backdrop
        className={styles.backdrop}
        isDismissable={!isBusy}
        isKeyboardDismissDisabled={isBusy}
        isOpen
        onOpenChange={(isOpen) => {
          if (!isOpen && !isBusy) {
            onClose();
          }
        }}
        variant="blur"
      >
        <Modal.Container>
          <Modal.Dialog
            aria-label={ariaLabel}
            className={liquidGlassClassName({
              className: joinClassNames(styles.dialog, dialogClassName),
              kind: "panel",
              radius: "md",
            })}
            id={id}
          >
            <Modal.Header className={styles.header}>
              <div>
                <p className={styles.kicker}>{kicker}</p>
                <Modal.Heading>{title}</Modal.Heading>
              </div>
              <Button
                aria-label={`Close ${title}`}
                className={styles.closeButton}
                isDisabled={isBusy}
                isIconOnly
                onPress={onClose}
                variant="ghost"
              >
                ×
              </Button>
            </Modal.Header>
            <Modal.Body className={joinClassNames(styles.body, bodyClassName)}>
              {children}
            </Modal.Body>
            <Modal.Footer className={joinClassNames(styles.footer, footerClassName)}>
              {footer}
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
