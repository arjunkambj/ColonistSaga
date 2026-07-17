import { Suspense } from "react";

import { MvpApp } from "@/features/app/mvp-app";

export default function HomePage() {
  return (
    <Suspense fallback={<AppLoading label="Preparing Your Island…" />}>
      <MvpApp />
    </Suspense>
  );
}

function AppLoading({ label }: { label: string }) {
  return (
    <main className="centered-page" id="main-content">
      <div className="loading-mark" aria-hidden="true" />
      <p role="status">{label}</p>
    </main>
  );
}
