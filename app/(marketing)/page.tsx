import Link from 'next/link';

export default function LandingPage() {
  return (
    <main className="min-h-screen overflow-hidden px-6 py-10">
      <nav className="mx-auto flex max-w-6xl items-center justify-between">
        <span className="font-semibold">AlgoFlow</span>
        <Link
          href="/access"
          className="rounded-full border border-white/15 px-4 py-2 text-sm text-slate-300 transition hover:border-cyan-300/50 hover:text-white"
        >
          Personal access
        </Link>
      </nav>
      <div className="mx-auto grid max-w-6xl gap-16 py-20 lg:grid-cols-[1.05fr_.95fr] lg:items-center">
        <section>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-cyan-300">
            Learn · prove · retain
          </p>
          <h1 className="mt-6 max-w-3xl text-5xl font-semibold leading-[1.02] tracking-[-0.045em] sm:text-7xl">
            Algorithms you can <span className="text-amber-300">see</span>,
            test, and remember.
          </h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-400">
            Follow structured paths, inspect every algorithm step, ask grounded
            questions, and let spaced review decide what comes next.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link
              href="/dashboard"
              className="rounded-xl bg-cyan-300 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-200"
            >
              Open my dashboard
            </Link>
            <Link
              href="/lessons/bubble-sort-js"
              className="rounded-xl border border-white/15 px-5 py-3 font-semibold text-slate-100 transition hover:bg-white/[0.06]"
            >
              See Bubble Sort
            </Link>
          </div>
        </section>
        <section className="relative rounded-[2rem] border border-white/10 bg-[#081820] p-7 shadow-2xl shadow-cyan-950/30">
          <div className="absolute inset-0 rounded-[2rem] bg-[radial-gradient(circle_at_50%_0%,rgba(34,211,238,.08),transparent_52%)]" />
          <div className="relative">
            <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.22em] text-slate-500">
              <span>Today&apos;s learning loop</span>
              <span className="text-emerald-300">4 due</span>
            </div>
            <div className="mt-8 space-y-3">
              {[
                [
                  '01',
                  'Study',
                  'Bubble Sort · compare & swap',
                  'text-amber-300',
                ],
                ['02', 'Assess', 'Checkpoint · 2 questions', 'text-cyan-300'],
                ['03', 'Retain', 'Review sorting invariant', 'text-violet-300'],
              ].map(([number, label, detail, color]) => (
                <div
                  key={number}
                  className="flex items-center gap-4 rounded-2xl border border-white/[0.08] bg-black/15 p-4"
                >
                  <span className={`font-mono text-xs ${color}`}>{number}</span>
                  <div>
                    <p className="text-sm font-medium">{label}</p>
                    <p className="mt-1 text-xs text-slate-500">{detail}</p>
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
