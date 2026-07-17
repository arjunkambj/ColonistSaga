"use client";

import dynamic from "next/dynamic";

import type { BrowserAppProps } from "@/features/app/browser-app";

const BrowserApp = dynamic<BrowserAppProps>(
  () => import("@/features/app/browser-app").then((module) => module.BrowserApp),
  {
    loading: () => (
      <main className="centered-page" id="main-content">
        <div className="loading-mark" aria-hidden="true" />
        <p role="status">Connecting to the island…</p>
      </main>
    ),
    ssr: false,
  },
);

export function ClientApp(props: BrowserAppProps) {
  return <BrowserApp {...props} />;
}
