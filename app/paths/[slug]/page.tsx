import Link from 'next/link';
import { notFound } from 'next/navigation';
import AppShell from '../../../components/layout/AppShell';
import { lessonBySlug, pathBySlug } from '../../../lib/content/catalog';
import { getLearningRepository } from '../../../lib/persistence';

export const dynamic = 'force-dynamic';

export default async function PathPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const path = pathBySlug.get(slug);
  if (!path) notFound();
  const snapshot = await getLearningRepository().getSnapshot();
  const completed = new Set(
    snapshot.progress
      .filter((item) => item.status === 'completed')
      .map((item) => item.lessonSlug),
  );
  return (
    <AppShell>
      <Link href="/paths" className="text-sm text-slate-500 hover:text-white">
        ← All paths
      </Link>
      <p className="mt-8 font-mono text-xs uppercase tracking-[0.28em] text-amber-300">
        Learning path
      </p>
      <h1 className="mt-3 text-4xl font-semibold">{path.title}</h1>
      <p className="mt-3 max-w-2xl text-slate-400">{path.description}</p>
      <div className="mt-10 space-y-4">
        {path.lessonSlugs.map((slug, index) => {
          const lesson = lessonBySlug.get(slug)!;
          const unlocked = lesson.prerequisites.every((required) =>
            completed.has(required),
          );
          const done = completed.has(slug);
          return (
            <div
              key={slug}
              className="grid gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:grid-cols-[auto_1fr_auto] sm:items-center"
            >
              <span
                className={`grid h-10 w-10 place-items-center rounded-full border font-mono text-xs ${done ? 'border-emerald-300/40 bg-emerald-300/10 text-emerald-300' : 'border-white/10 text-slate-500'}`}
              >
                {done ? '✓' : index + 1}
              </span>
              <div>
                <h2 className="font-semibold">{lesson.title}</h2>
                <p className="mt-1 text-sm text-slate-500">{lesson.summary}</p>
              </div>
              {unlocked ? (
                <Link
                  href={`/lessons/${slug}`}
                  className="rounded-lg border border-white/15 px-4 py-2 text-center text-sm hover:bg-white/[0.06]"
                >
                  {done ? 'Review' : 'Start'}
                </Link>
              ) : (
                <span className="text-xs text-slate-600">Locked</span>
              )}
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}
