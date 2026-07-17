"use client";

import { Button } from "@heroui/react";
import { useState } from "react";

import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Brand } from "@/components/ui/brand";

export interface NoticeScreenProps {
  actionLabel: string;
  confirmation?: {
    confirmLabel: string;
    description: string;
    title: string;
  };
  message: string;
  onAction(): Promise<void> | void;
  title: string;
}

export function NoticeScreen({
  actionLabel,
  confirmation,
  message,
  onAction,
  title,
}: NoticeScreenProps) {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [runningAction, setRunningAction] = useState(false);

  const runAction = async () => {
    if (runningAction) {
      return;
    }
    setRunningAction(true);
    try {
      await onAction();
      setShowConfirmation(false);
    } finally {
      setRunningAction(false);
    }
  };

  return (
    <>
      <main className="centered-page notice-page" id="main-content">
        <section className="notice-card">
          <Brand />
          <h1>{title}</h1>
          <p>{message}</p>
          <Button
            className="button button-primary"
            isPending={runningAction}
            onPress={() => (confirmation ? setShowConfirmation(true) : void runAction())}
          >
            {actionLabel}
          </Button>
        </section>
      </main>
      {confirmation && showConfirmation ? (
        <ConfirmationDialog
          busy={runningAction}
          confirmLabel={confirmation.confirmLabel}
          description={confirmation.description}
          onCancel={() => setShowConfirmation(false)}
          onConfirm={() => void runAction()}
          title={confirmation.title}
        />
      ) : null}
    </>
  );
}
