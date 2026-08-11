import Link from 'next/link';
import AppShell from '../../components/layout/AppShell';
import { getSimulations } from '../../lib/server/learningData';

export const dynamic = 'force-dynamic';

export default async function SimulationsPage() {
  const items = await getSimulations();
  return (
    <AppShell>
      <p className="eyebrow text-ink">System Design Lab</p>
      <h1 className="mt-3 max-w-3xl text-4xl font-semibold">
        Build the architecture. Watch the flow. Defend the trade-offs.
      </h1>
      <p className="mt-4 max-w-3xl text-lg leading-8 text-muted">
        Each scenario gives you an editable topology, representative traffic
        animation, deterministic rubric, and an optional AI patch you control.
      </p>
      <div className="mt-10 grid gap-5 lg:grid-cols-3">
        {items.map(({ scenario, draft, latestAttempt }) => (
          <Link
            key={scenario.slug}
            href={`/simulations/${scenario.slug}`}
            className="group rounded-3xl border border-line bg-surface p-7 transition hover:-translate-y-0.5 hover:border-line-strong"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="eyebrow">{scenario.difficulty}</span>
              {latestAttempt && (
                <span
                  className={`text-sm ${latestAttempt.evaluation.passed ? 'text-success' : 'text-warning'}`}
                >
                  {latestAttempt.evaluation.score}%
                </span>
              )}
            </div>
            <h2 className="mt-5 text-2xl font-semibold">{scenario.title}</h2>
            <p className="mt-3 min-h-20 text-sm leading-6 text-subtle">
              {scenario.summary}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {scenario.traffic.slice(0, 2).map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-line px-2.5 py-1 text-[10px] text-muted"
                >
                  {item}
                </span>
              ))}
            </div>
            <p className="mt-6 text-sm text-ink">
              {draft ? 'Resume saved draft' : 'Start scenario'} →
            </p>
          </Link>
        ))}
      </div>
      <section className="mt-12 rounded-2xl border border-line bg-surface p-6">
        <p className="eyebrow">How scoring works</p>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
          Versioned rules inspect blocks, connections, configuration, and your
          explanation. AI can explain or propose a patch, but it never decides
          the canonical score.
        </p>
      </section>
    </AppShell>
  );
}
