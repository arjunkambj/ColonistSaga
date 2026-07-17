"use client";

import { HexclaveProvider, HexclaveTheme } from "@hexclave/next";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { useMemo, type ReactNode } from "react";

import { createHexclaveClientApp } from "@/hexclave/client";

export interface AppProvidersProps {
  children: ReactNode;
  convexUrl?: string;
  hexclaveProjectId?: string;
  hexclavePublishableClientKey?: string;
}

export function AppProviders({
  children,
  convexUrl,
  hexclaveProjectId,
  hexclavePublishableClientKey,
}: AppProvidersProps) {
  const clients = useMemo(() => {
    if (!convexUrl || !hexclaveProjectId) {
      return null;
    }

    const hexclave = createHexclaveClientApp(hexclaveProjectId, hexclavePublishableClientKey);
    const convex = new ConvexReactClient(convexUrl);
    convex.setAuth(hexclave.getConvexClientAuth({}));

    return { convex, hexclave };
  }, [convexUrl, hexclaveProjectId, hexclavePublishableClientKey]);

  if (!clients) {
    return <SetupRequired />;
  }

  return (
    <HexclaveProvider app={clients.hexclave}>
      <HexclaveTheme>
        <ConvexProvider client={clients.convex}>{children}</ConvexProvider>
      </HexclaveTheme>
    </HexclaveProvider>
  );
}

function SetupRequired() {
  return (
    <main className="centered-page setup-page" id="main-content">
      <div className="brand-mark" aria-hidden="true">
        C
      </div>
      <p className="eyebrow">One Last Step</p>
      <h1>Connect Catansaga</h1>
      <p>
        Add the Convex deployment URL and Hexclave project ID to
        <code> apps/web/.env.local</code>, then restart the web server.
      </p>
      <pre>{`NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
NEXT_PUBLIC_HEXCLAVE_PROJECT_ID=your-project-id`}</pre>
    </main>
  );
}
