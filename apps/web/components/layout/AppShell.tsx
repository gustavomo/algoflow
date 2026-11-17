import Link from 'next/link';
import type { ReactNode } from 'react';
import ThemeToggle from './ThemeToggle';

const desktopLinks = [
  ['Dashboard', '/dashboard'],
  ['Paths', '/paths'],
  ['Topics', '/topics'],
  ['Reading', '/reading'],
  ['Design Lab', '/simulations'],
  ['Review', '/review'],
  ['Progress', '/progress'],
] as const;

const mobileLinks = [
  ['Dashboard', '/dashboard'],
  ['Paths', '/paths'],
  ['Reading', '/reading'],
  ['Design', '/simulations'],
  ['Review', '/review'],
] as const;

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen min-w-0">
      <header className="sticky top-0 z-40 border-b border-line bg-canvas/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl min-w-0 items-center gap-3 px-4 py-2.5 sm:gap-6 sm:px-5">
          <Link
            href="/dashboard"
            className="mr-auto flex items-center gap-3 font-semibold tracking-tight"
          >
            <span className="grid h-8 w-8 place-items-center rounded-lg border border-line-strong bg-ink font-mono text-xs text-canvas">
              AF
            </span>
            AlgoFlow
          </Link>
          <nav
            className="hidden items-center gap-1 text-sm text-muted sm:flex"
            aria-label="Primary navigation"
          >
            {desktopLinks.map(([label, href]) => (
              <Link
                key={href}
                href={href}
                className="whitespace-nowrap rounded-lg px-3 py-2 transition hover:bg-surface hover:text-ink"
              >
                {label}
              </Link>
            ))}
          </nav>
          <ThemeToggle />
        </div>
      </header>
      <main className="mx-auto min-w-0 max-w-7xl px-4 py-8 pb-28 sm:px-5 sm:py-10 sm:pb-10">
        {children}
      </main>
      <nav
        className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-5 border-t border-line bg-canvas/95 px-1 pb-[max(.45rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl sm:hidden"
        aria-label="Mobile navigation"
      >
        {mobileLinks.map(([label, href]) => (
          <Link
            key={href}
            href={href}
            className="min-w-0 rounded-lg px-1 py-2 text-center text-[10px] font-medium text-muted transition hover:bg-surface-raised hover:text-ink"
          >
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
