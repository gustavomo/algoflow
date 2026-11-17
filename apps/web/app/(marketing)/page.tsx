import Link from 'next/link';

export default function LandingPage() {
  return (
    <main className="min-h-screen overflow-hidden px-6 py-10">
      <nav className="mx-auto flex max-w-6xl items-center justify-between">
        <span className="font-semibold">AlgoFlow</span>
        <Link
          href="/access"
          className="rounded-full border border-line-strong px-4 py-2 text-sm text-ink-soft transition hover:border-line-strong hover:text-ink"
        >
          Personal access
        </Link>
      </nav>
      <div className="mx-auto grid max-w-6xl gap-16 py-20 lg:grid-cols-[1.05fr_.95fr] lg:items-center">
        <section>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-ink">
            Learn · prove · retain
          </p>
          <h1 className="mt-6 max-w-3xl text-5xl font-semibold leading-[1.02] tracking-[-0.045em] sm:text-7xl">
            Algorithms you can{' '}
            <span className="underline decoration-1 underline-offset-8">
              see
            </span>
            , test, and remember.
          </h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-muted">
            Follow structured paths, inspect every algorithm step, ask grounded
            questions, and let spaced review decide what comes next.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link
              href="/dashboard"
              className="rounded-xl bg-action px-5 py-3 font-semibold text-canvas transition hover:bg-action-hover"
            >
              Open my dashboard
            </Link>
            <Link
              href="/lessons/bubble-sort-js"
              className="rounded-xl border border-line-strong px-5 py-3 font-semibold text-ink transition hover:bg-surface"
            >
              See Bubble Sort
            </Link>
          </div>
        </section>
        <section className="relative rounded-[2rem] border border-line bg-surface p-7 shadow-elevated">
          <div className="absolute inset-x-8 top-0 h-px bg-ink/60" />
          <div className="relative">
            <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.22em] text-subtle">
              <span>Today&apos;s learning loop</span>
              <span className="text-success">4 due</span>
            </div>
            <div className="mt-8 space-y-3">
              {[
                ['01', 'Study', 'Bubble Sort · compare & swap', 'text-muted'],
                ['02', 'Assess', 'Checkpoint · 2 questions', 'text-ink'],
                ['03', 'Retain', 'Review sorting invariant', 'text-ink-soft'],
              ].map(([number, label, detail, color]) => (
                <div
                  key={number}
                  className="flex items-center gap-4 rounded-2xl border border-line bg-canvas/60 p-4"
                >
                  <span className={`font-mono text-xs ${color}`}>{number}</span>
                  <div>
                    <p className="text-sm font-medium">{label}</p>
                    <p className="mt-1 text-xs text-subtle">{detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
