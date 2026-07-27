"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode, type SVGProps } from "react";
import { cn } from "@/lib/cn";
import { NAV_ITEMS } from "./nav-items";
import { ThemeToggle } from "./ThemeToggle";

type NavState = "active" | "idle";

const NAV_LINK_STATE: Record<NavState, string> = {
  active: "border-ember bg-steel-800 text-ember",
  idle: "border-transparent text-bone-soft hover:bg-steel-850 hover:text-bone",
};

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

// Menu/close glyphs are shell-local chrome, not part of the shared icon set.
function IconMenu(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" {...props}>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function IconClose(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" {...props}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

function Wordmark({ compact }: { compact?: boolean }) {
  if (compact) {
    return (
      <Link href="/" className="heading-stencil text-lg leading-none text-bone transition-colors hover:text-ember">
        Ashen <span className="text-ember">Armoury</span>
      </Link>
    );
  }
  return (
    <Link href="/" className="block px-5 pb-5 pt-6">
      <span className="heading-stencil block text-2xl leading-[1.1] text-bone">
        Ashen
        <br />
        <span className="text-ember">Armoury</span>
      </span>
      <span className="stamp-ember mt-3">Weapon Fabricator</span>
    </Link>
  );
}

function NavList({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav aria-label="Primary" className="space-y-1 px-3">
      {NAV_ITEMS.map((item) => {
        const state: NavState = isActive(pathname, item.href) ? "active" : "idle";
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={state === "active" ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-card border-l-2 px-3 py-2.5 font-display text-sm uppercase tracking-title transition-colors",
              NAV_LINK_STATE[state],
            )}
          >
            <Icon className="h-5 w-5 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  return (
    <div className="min-h-screen">
      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-rivet/40 bg-steel-900/95 px-4 py-3 backdrop-blur lg:hidden">
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-label="Open navigation"
          className="rounded-card border border-rivet/50 p-2 text-bone-soft transition-colors hover:text-bone"
        >
          <IconMenu className="h-5 w-5" />
        </button>
        <Wordmark compact />
      </header>

      {/* Mobile slide-over */}
      {menuOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-steel-950/70"
            onClick={() => setMenuOpen(false)}
            aria-hidden
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
            className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] animate-fade-in flex-col border-r border-rivet/40 bg-steel-900 shadow-raised"
          >
            <div className="flex items-center justify-between px-5 pb-4 pt-5">
              {/* Capture so the wordmark's home link also dismisses the menu. */}
              <span onClickCapture={() => setMenuOpen(false)}>
                <Wordmark compact />
              </span>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label="Close navigation"
                className="rounded-card border border-rivet/50 p-2 text-bone-soft transition-colors hover:text-bone"
              >
                <IconClose className="h-5 w-5" />
              </button>
            </div>
            <NavList pathname={pathname} onNavigate={() => setMenuOpen(false)} />
            <div className="mt-auto border-t border-rivet/40 px-3 py-4">
              <ThemeToggle className="w-full" />
            </div>
          </div>
        </div>
      ) : null}

      <div className="lg:flex">
        {/* Desktop sidebar */}
        <aside className="hidden border-r border-rivet/40 bg-steel-900/80 lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-64 lg:shrink-0 lg:flex-col">
          <Wordmark />
          <NavList pathname={pathname} />
          <div className="mt-auto border-t border-rivet/40 px-3 py-4">
            <ThemeToggle className="w-full" />
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <div className="mx-auto max-w-7xl px-4 py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
