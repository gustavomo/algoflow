import Link from 'next/link';
import type { SystemScenarioCategory } from '@algoflow/contracts';
import AppShell from '../../components/layout/AppShell';
import { getSimulations } from '../../lib/server/learningData';

export const dynamic = 'force-dynamic';

const categories: Array<{
  value: 'all' | SystemScenarioCategory;
  label: string;
}> = [
  { value: 'all', label: 'All' },
  { value: 'system-design', label: 'System design' },
  { value: 'migration', label: 'Migration' },
  { value: 'database', label: 'Database' },
  { value: 'reliability', label: 'Reliability' },
];

export default async function SimulationsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const items = await getSimulations();
  const requestedCategory = (await searchParams).category;
  const selectedCategory = categories.some(
    (category) => category.value === requestedCategory,
  )
    ? (requestedCategory as 'all' | SystemScenarioCategory)
    : 'all';
  const visibleItems =
    selectedCategory === 'all'
      ? items
      : items.filter(({ scenario }) => scenario.category === selectedCategory);
  return (
    <AppShell>
      <p className="eyebrow text-ink">Design Lab</p>
      <h1 className="mt-3 max-w-3xl text-4xl font-semibold">
        Build the architecture. Watch the flow. Defend the trade-offs.
      </h1>
      <p className="mt-4 max-w-3xl text-lg leading-8 text-muted">
        Each scenario gives you an editable topology, representative traffic
        animation, deterministic rubric, and an optional AI patch you control.
      </p>
      {process.env.ENABLE_SCENARIO_AUTHORING === '1' &&
        process.env.NODE_ENV !== 'production' && (
          <Link
            href="/authoring/scenarios"
            className="button-secondary mt-5 inline-flex px-4 py-2.5 text-sm"
          >
            Open local scenario authoring →
          </Link>
        )}
      <nav
        aria-label="Scenario categories"
        className="mt-8 flex flex-wrap gap-2"
      >
        {categories.map((category) => {
          const active = category.value === selectedCategory;
          return (
            <Link
              key={category.value}
              href={
                category.value === 'all'
                  ? '/simulations'
                  : `/simulations?category=${category.value}`
              }
              aria-current={active ? 'page' : undefined}
              className={`rounded-full border px-4 py-2 text-sm transition ${
                active
                  ? 'border-ink bg-ink text-canvas'
                  : 'border-line text-subtle hover:border-line-strong hover:text-ink'
              }`}
            >
              {category.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-10 grid gap-5 lg:grid-cols-3">
        {visibleItems.map(({ scenario, draft, latestAttempt }) => (
          <Link
            key={scenario.slug}
            href={`/simulations/${scenario.slug}`}
            className="group rounded-3xl border border-line bg-surface p-7 transition hover:-translate-y-0.5 hover:border-line-strong"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="eyebrow">
                {scenario.category.replace('-', ' ')} · {scenario.difficulty}
              </span>
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
              <span className="rounded-full border border-line px-2.5 py-1 text-[10px] text-muted">
                {scenario.estimatedMinutes} min
              </span>
              {scenario.topics.slice(0, 2).map((item) => (
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
