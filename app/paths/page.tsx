import Link from 'next/link';
import AppShell from '../../components/layout/AppShell';
import { learningPaths } from '../../lib/content/catalog';
import { getLearningRepository } from '../../lib/persistence';

export const dynamic = 'force-dynamic';

export default async function PathsPage() {
  const snapshot = await getLearningRepository().getSnapshot();
  const completed = new Set(
    snapshot.progress
      .filter((item) => item.status === 'completed')
      .map((item) => item.lessonSlug),
  );
  return (
    <AppShell>
      <p className="font-mono text-xs uppercase tracking-[0.28em] text-amber-300">
        Guided curriculum
      </p>
      <h1 className="mt-3 text-4xl font-semibold">Learning paths</h1>
      <div className="mt-10 grid gap-5 lg:grid-cols-3">
        {learningPaths.map((path) => {
          const done = path.lessonSlugs.filter((slug) =>
            completed.has(slug),
          ).length;
          return (
            <Link
              key={path.slug}
              href={`/paths/${path.slug}`}
              className="rounded-3xl border border-white/10 bg-white/[0.035] p-7 transition hover:-translate-y-1 hover:border-amber-300/30"
            >
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-amber-300">
                {path.lessonSlugs.length} lessons · {path.estimatedMinutes} min
              </p>
              <h2 className="mt-4 text-2xl font-semibold">{path.title}</h2>
              <p className="mt-3 leading-7 text-slate-400">
                {path.description}
              </p>
              <p className="mt-6 text-sm text-slate-500">
                {done}/{path.lessonSlugs.length} complete
              </p>
            </Link>
          );
        })}
      </div>
    </AppShell>
  );
}
