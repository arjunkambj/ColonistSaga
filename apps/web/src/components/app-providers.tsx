"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import type { ReactNode } from "react";
import { useMemo } from "react";

export function AppProviders({ children, convexUrl }: { children: ReactNode; convexUrl?: string }) {
  const convexClient = useMemo(
    () => (convexUrl ? new ConvexReactClient(convexUrl) : null),
    [convexUrl],
  );

  if (!convexClient) {
    return <SetupRequired />;
  }

  return <ConvexProvider client={convexClient}>{children}</ConvexProvider>;
}

function SetupRequired() {
  return (
    <main className="centered-page setup-page" id="main-content">
      <div className="brand-mark" aria-hidden="true">
        C
      </div>
      <p className="eyebrow">One Last Step</p>
      <h1>Connect Catansaga to Convex</h1>
      <p>
        Add your deployment URL as <code>NEXT_PUBLIC_CONVEX_URL</code> in
        <code> apps/web/.env.local</code>, then restart the web server.
      </p>
      <pre> NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud</pre>
    </main>
  );
}
