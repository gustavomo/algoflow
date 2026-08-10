import Link from 'next/link';
import type { ReactNode } from 'react';

const links = [
  ['Dashboard', '/dashboard'],
  ['Paths', '/paths'],
  ['Topics', '/topics'],
  ['Review', '/review'],
  ['Progress', '/progress'],
] as const;

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#061015]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-5 py-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 font-semibold tracking-tight"
          >
            <span className="grid h-8 w-8 place-items-center rounded-lg border border-cyan-300/30 bg-cyan-300/10 font-mono text-xs text-cyan-200">
              AF
            </span>
            AlgoFlow
          </Link>
          <nav
            className="flex max-w-full gap-1 overflow-x-auto text-sm text-slate-400"
            aria-label="Primary navigation"
          >
            {links.map(([label, href]) => (
              <Link
                key={href}
                href={href}
                className="whitespace-nowrap rounded-lg px-3 py-2 transition hover:bg-white/[0.06] hover:text-white"
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-5 py-10">{children}</main>
    </div>
  );
}
