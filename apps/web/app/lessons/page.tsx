import Link from 'next/link';
import AppShell from '../../components/layout/AppShell';
import { getCatalog } from '../../lib/server/learningData';

export default async function LessonsPage({
  searchParams,
}: {
  searchParams: Promise<{ tech?: string }>;
}) {
  const { tech: requestedTech } = await searchParams;
  const { lessons } = await getCatalog();
  const tech = ['js', 'ts', 'go'].includes(requestedTech ?? '')
    ? requestedTech
    : undefined;
  const filtered = tech
    ? lessons.filter((lesson) => lesson.tech === tech)
    : lessons;
  return (
    <AppShell>
      <p className="font-mono text-xs uppercase tracking-[0.28em] text-ink">
        {lessons.length} guided lessons
      </p>
      <div className="mt-3 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-4xl font-semibold">Lesson catalog</h1>
          <p className="mt-3 text-muted">
            Filter by implementation language, then follow the prerequisite
            links.
          </p>
        </div>
        <div className="flex gap-2">
          {[
            ['All', undefined],
            ['JS', 'js'],
            ['TS', 'ts'],
            ['Go', 'go'],
          ].map(([label, value]) => (
            <Link
              key={label}
              href={value ? `/lessons?tech=${value}` : '/lessons'}
              className={`rounded-lg border px-3 py-2 text-sm ${tech === value || (!tech && !value) ? 'border-line-strong bg-surface-raised text-ink' : 'border-line text-subtle'}`}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
      <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((lesson) => (
          <Link
            key={lesson.slug}
            href={`/lessons/${lesson.slug}`}
            className="rounded-2xl border border-line bg-surface p-6 transition hover:-translate-y-0.5 hover:border-line-strong"
          >
            <div className="flex justify-between font-mono text-[10px] uppercase tracking-[0.2em] text-subtle">
              <span>{lesson.tech}</span>
              <span>{lesson.estimatedMinutes} min</span>
            </div>
            <h2 className="mt-5 text-xl font-semibold">{lesson.title}</h2>
            <p className="mt-3 text-sm leading-6 text-subtle">
              {lesson.summary}
            </p>
            <p className="mt-6 text-sm text-ink">Open lesson →</p>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
