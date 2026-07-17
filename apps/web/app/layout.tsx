import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import { AppProviders } from "@/components/app-providers";

import "./styles.css";

export const metadata: Metadata = {
  description: "A friendly real-time island-building board game.",
  title: "Catansaga",
};

export const viewport: Viewport = {
  colorScheme: "dark",
  themeColor: "#102f3b",
  width: "device-width",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main-content">
          Skip to Game
        </a>
        <AppProviders convexUrl={process.env.NEXT_PUBLIC_CONVEX_URL}>{children}</AppProviders>
      </body>
    </html>
  );
}
