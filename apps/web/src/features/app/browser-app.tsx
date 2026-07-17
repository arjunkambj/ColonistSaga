"use client";

import { AppProviders, type AppProvidersProps } from "@/components/app-providers";
import { MvpApp } from "@/features/app/mvp-app";

export type BrowserAppProps = Omit<AppProvidersProps, "children">;

export function BrowserApp(props: BrowserAppProps) {
  return (
    <AppProviders {...props}>
      <MvpApp />
    </AppProviders>
  );
}
