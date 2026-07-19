import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import Link from "next/link";

import { DEFAULT_THEME, THEME_STORAGE_KEY } from "@/lib/theme";

import "./styles.css";
import "./liquid-glass.css";
import "./reference-screens.css";

export const metadata: Metadata = {
  description: "A friendly real-time island-building board game.",
  title: "ColonistSaga",
};

export const viewport: Viewport = {
  width: "device-width",
};

const themeInitializationScript = `try {
  const theme = localStorage.getItem("${THEME_STORAGE_KEY}") === "dark" ? "dark" : "${DEFAULT_THEME}";
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(theme);
  root.dataset.theme = theme;
} catch {}`;

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html className="light" data-theme="light" lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitializationScript }} />
      </head>
      <body className="bg-background text-foreground">
        <Link className="skip-link" href="#main-content">
          Skip to Game
        </Link>
        {children}
      </body>
    </html>
  );
}
