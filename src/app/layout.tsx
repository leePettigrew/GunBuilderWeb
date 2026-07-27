import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { AppShell } from "@/components/shell/AppShell";
import { DataProvider } from "@/lib/data/context";
import { THEME_INIT_SCRIPT } from "@/lib/data/theme-script";
import { ThemeProvider } from "@/lib/data/theme";

export const metadata: Metadata = {
  title: "Ashen Armoury — Weapon Fabricator",
  description:
    "Blueprint-driven weapon fabricator for the Ashen Skies system: spec firearms, bows, crossbows, grenades and melee weapons, tune the rules live, and share patterns.",
};

const FONT_VARS = `:root { --font-display: 'Allerta Stencil', Impact, sans-serif; --font-body: 'Barlow', 'Segoe UI', sans-serif; --font-mono: 'IBM Plex Mono', Consolas, monospace; }`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // suppressHydrationWarning: THEME_INIT_SCRIPT may stamp `light` pre-hydration.
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Allerta+Stencil&family=Barlow:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
        <style dangerouslySetInnerHTML={{ __html: FONT_VARS }} />
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>
        <ThemeProvider>
          <DataProvider>
            <AppShell>{children}</AppShell>
          </DataProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
