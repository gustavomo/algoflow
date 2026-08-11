import Link from 'next/link';
import { notFound } from 'next/navigation';
import AppShell from '../../../components/layout/AppShell';
import {
  getCatalog,
  getLearningSnapshot,
} from '../../../lib/server/learningData';

export const dynamic = 'force-dynamic';

export default async function TrackPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [{ tracks, learningPaths }, snapshot] = await Promise.all([
    getCatalog(),
    getLearningSnapshot(),
  ]);
  const track = tracks.find((candidate) => candidate.slug === slug);
  if (!track) notFound();
  const pathBySlug = new Map(learningPaths.map((path) => [path.slug, path]));
  const completed = new Set(
    snapshot.progress
      .filter((item) => item.status === 'completed')
      .map((item) => item.lessonSlug),
  );
  return (
    <AppShell>
      <Link href="/paths" className="text-sm text-subtle hover:text-ink">
        ← All tracks
      </Link>
      <p className="mt-8 eyebrow">
        Learning track {String(track.order).padStart(2, '0')}
      </p>
      <h1 className="mt-3 text-4xl font-semibold">{track.title}</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-muted">
        {track.description}
      </p>
      <div className="mt-8 flex flex-wrap gap-2">
        {track.outcomes.map((outcome) => (
          <span
            key={outcome}
            className="rounded-full border border-line px-3 py-2 text-xs text-ink-soft"
          >
            {outcome}
          </span>
        ))}
      </div>
      <div className="mt-10 border-y border-line">
        {track.pathSlugs.map((pathSlug, index) => {
          const path = pathBySlug.get(pathSlug)!;
          const done = path.lessonSlugs.filter((lessonSlug) =>
            completed.has(lessonSlug),
          ).length;
          return (
            <Link
              key={path.slug}
              href={`/paths/${path.slug}`}
              className="group grid gap-4 border-b border-line py-6 transition last:border-b-0 lg:grid-cols-[180px_1fr_auto] lg:items-center"
            >
              <p className="eyebrow">
                Path {index + 1} · {path.level}
              </p>
              <div>
                <h2 className="text-xl font-semibold transition group-hover:translate-x-1">
                  {path.title}
                </h2>
                <p className="mt-2 text-sm leading-6 text-subtle">
                  {path.description}
                </p>
              </div>
              <p className="text-xs text-muted lg:text-right">
                {done}/{path.lessonSlugs.length} lessons ·{' '}
                {
                  path.modules.filter((module) => module.status === 'practice')
                    .length
                }{' '}
                labs ·{' '}
                {
                  path.modules.filter((module) => module.status === 'planned')
                    .length
                }{' '}
                planned
              </p>
            </Link>
          );
        })}
      </div>
    </AppShell>
  );
}
