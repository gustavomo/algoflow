import Link from 'next/link';
import AppShell from '../../components/layout/AppShell';
import { lessons } from '../../lib/content/catalog';

export default async function LessonsPage({
  searchParams,
}: {
  searchParams: Promise<{ tech?: string }>;
}) {
  const { tech: requestedTech } = await searchParams;
  const tech = ['js', 'ts', 'go'].includes(requestedTech ?? '')
    ? requestedTech
    : undefined;
  const filtered = tech
    ? lessons.filter((lesson) => lesson.tech === tech)
    : lessons;
  return (
    <AppShell>
      <p className="font-mono text-xs uppercase tracking-[0.28em] text-cyan-300">
        Six guided lessons
      </p>
      <div className="mt-3 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-4xl font-semibold">Lesson catalog</h1>
          <p className="mt-3 text-slate-400">
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
              className={`rounded-lg border px-3 py-2 text-sm ${tech === value || (!tech && !value) ? 'border-cyan-300/40 bg-cyan-300/10 text-cyan-200' : 'border-white/10 text-slate-500'}`}
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
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition hover:-translate-y-0.5 hover:border-cyan-300/30"
          >
            <div className="flex justify-between font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">
              <span>{lesson.tech}</span>
              <span>{lesson.estimatedMinutes} min</span>
            </div>
            <h2 className="mt-5 text-xl font-semibold">{lesson.title}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              {lesson.summary}
            </p>
            <p className="mt-6 text-sm text-cyan-300">Open lesson →</p>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
