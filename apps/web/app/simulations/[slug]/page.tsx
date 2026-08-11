import Link from 'next/link';
import AppShell from '../../../components/layout/AppShell';
import SystemDesignStudio from '../../../components/simulations/SystemDesignStudio';
import { getSimulation } from '../../../lib/server/learningData';

export const dynamic = 'force-dynamic';

export default async function SimulationPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { scenario, challenge, draft, attempts } = await getSimulation(slug);
  return (
    <AppShell>
      <Link href="/simulations" className="text-sm text-subtle hover:text-ink">
        ← All scenarios
      </Link>
      <div className="mt-7 grid gap-6 lg:grid-cols-[1fr_.65fr] lg:items-end">
        <div>
          <p className="eyebrow">
            {scenario.category.replace('-', ' ')} · {scenario.difficulty} ·{' '}
            {scenario.estimatedMinutes} min · scenario v{scenario.version}
          </p>
          <h1 className="mt-3 text-4xl font-semibold">{scenario.title}</h1>
          <p className="mt-3 max-w-3xl text-muted">{scenario.goal}</p>
        </div>
        <div className="flex flex-wrap gap-2 lg:justify-end">
          {scenario.traffic.map((item) => (
            <span
              key={item}
              className="rounded-full border border-line px-3 py-2 text-xs text-ink-soft"
            >
              {item}
            </span>
          ))}
        </div>
      </div>
      <SystemDesignStudio
        scenario={scenario}
        challenge={challenge}
        draft={draft}
        initialAttempts={attempts}
      />
    </AppShell>
  );
}
