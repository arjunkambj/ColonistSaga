import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import Link from "next/link";

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

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <Link className="skip-link" href="#main-content">
          Skip to Game
        </Link>
        {children}
      </body>
    </html>
  );
}
