import Link from 'next/link';
import { notFound } from 'next/navigation';
import AppShell from '../../../components/layout/AppShell';
import FocusPathButton from '../../../components/learning/FocusPathButton';
import {
  getCatalog,
  getLearningSnapshot,
} from '../../../lib/server/learningData';

export const dynamic = 'force-dynamic';

export default async function PathPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [{ learningPaths, lessons, tracks }, snapshot] = await Promise.all([
    getCatalog(),
    getLearningSnapshot(),
  ]);
  const pathBySlug = new Map(learningPaths.map((path) => [path.slug, path]));
  const lessonBySlug = new Map(lessons.map((lesson) => [lesson.slug, lesson]));
  const trackBySlug = new Map(tracks.map((track) => [track.slug, track]));
  const path = pathBySlug.get(slug);
  if (!path) notFound();
  const track = trackBySlug.get(path.trackSlug)!;
  const completed = new Set(
    snapshot.progress
      .filter((item) => item.status === 'completed')
      .map((item) => item.lessonSlug),
  );
  const done = path.lessonSlugs.filter((lessonSlug) =>
    completed.has(lessonSlug),
  ).length;

  return (
    <AppShell>
      <Link
        href={`/tracks/${track.slug}`}
        className="text-sm text-subtle hover:text-ink"
      >
        ← {track.title}
      </Link>
      <div className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow text-ink">{path.level} path</p>
          <h1 className="mt-3 text-4xl font-semibold">{path.title}</h1>
          <p className="mt-3 max-w-2xl text-muted">{path.description}</p>
        </div>
        <FocusPathButton
          pathSlug={path.slug}
          focused={snapshot.focusedPathSlug === path.slug}
        />
      </div>

      <div className="mt-8 grid border-y border-line sm:grid-cols-3 sm:divide-x sm:divide-line">
        <div className="py-5 sm:px-5 sm:first:pl-0">
          <p className="eyebrow">Available progress</p>
          <p className="mt-2 text-2xl font-semibold">
            {done}/{path.lessonSlugs.length}
          </p>
        </div>
        <div className="border-t border-line py-5 sm:border-t-0 sm:px-5">
          <p className="eyebrow">Practice · planned</p>
          <p className="mt-2 text-2xl font-semibold">
            {
              path.modules.filter((module) => module.status === 'practice')
                .length
            }{' '}
            ·{' '}
            {
              path.modules.filter((module) => module.status === 'planned')
                .length
            }
          </p>
        </div>
        <div className="border-t border-line py-5 sm:border-t-0 sm:px-5">
          <p className="eyebrow">Estimated effort</p>
          <p className="mt-2 text-2xl font-semibold">
            {Math.round(path.estimatedMinutes / 60)}h
          </p>
        </div>
      </div>

      <section className="mt-10 border-y border-line py-6">
        <h2 className="font-semibold">You will be able to</h2>
        <ul className="mt-4 grid gap-3 text-sm text-muted sm:grid-cols-2">
          {path.outcomes.map((outcome) => (
            <li key={outcome}>✓ {outcome}</li>
          ))}
        </ul>
        {path.prerequisitePathSlugs.length > 0 && (
          <p className="mt-5 text-xs text-subtle">
            Recommended first:{' '}
            {path.prerequisitePathSlugs
              .map((required) => pathBySlug.get(required)?.title ?? required)
              .join(' · ')}
          </p>
        )}
      </section>

      <div className="mt-10 border-y border-line">
        {path.modules.map((module, index) => {
          const lesson =
            module.status === 'available'
              ? lessonBySlug.get(module.lessonSlug)
              : undefined;
          const unlocked =
            lesson?.prerequisites.every((required) =>
              completed.has(required),
            ) ?? false;
          const complete = lesson ? completed.has(lesson.slug) : false;
          return (
            <div
              key={module.id}
              className="grid gap-4 border-b border-line py-6 last:border-b-0 sm:grid-cols-[auto_1fr_auto] sm:items-center"
            >
              <span
                className={`grid h-10 w-10 place-items-center rounded-full border font-mono text-xs ${complete ? 'border-success/40 bg-success-muted text-success' : 'border-line text-subtle'}`}
              >
                {complete ? '✓' : index + 1}
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold">{module.title}</h2>
                  <span
                    className={`rounded-full border px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider ${module.status !== 'planned' ? 'border-line-strong text-ink' : 'border-line text-faint'}`}
                  >
                    {module.status}
                  </span>
                </div>
                <p className="mt-1 text-sm text-subtle">{module.summary}</p>
                {module.resources && module.resources.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {module.resources.map((resource) => (
                      <a
                        key={resource.id}
                        href={resource.url}
                        target="_blank"
                        rel="noreferrer"
                        className="border-b border-line py-1 text-xs text-subtle transition hover:border-ink hover:text-ink"
                      >
                        {resource.provider} · {resource.title} ↗
                      </a>
                    ))}
                  </div>
                )}
              </div>
              {module.status === 'practice' ? (
                <Link
                  href={module.href}
                  className="button-primary px-4 py-2 text-center text-sm"
                >
                  Open lab
                </Link>
              ) : module.status === 'available' && unlocked ? (
                <Link
                  href={`/lessons/${module.lessonSlug}`}
                  className="button-secondary px-4 py-2 text-center text-sm"
                >
                  {complete ? 'Review' : 'Start'}
                </Link>
              ) : (
                <span className="text-xs text-faint">
                  {module.status === 'planned' ? 'Roadmap' : 'Locked'}
                </span>
              )}
            </div>
          );
        })}
      </div>
      {path.assessmentSlug && (
        <section className="mt-12 grid gap-5 border-y border-warning/50 py-7 sm:grid-cols-[1fr_auto] sm:items-center">
          <div>
            <p className="eyebrow text-warning">
              Readiness diagnostic · not completion
            </p>
            <h2 className="mt-3 text-xl font-semibold">
              Map what transfers before the full roadmap exists.
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-subtle">
              This path still contains planned teaching modules. The diagnostic
              identifies prerequisites and gaps; it cannot mark the path
              mastered.
            </p>
          </div>
          <Link
            href={`/assessments/${path.assessmentSlug}`}
            className="button-secondary px-5 py-3 text-center text-sm"
          >
            Map readiness →
          </Link>
        </section>
      )}
    </AppShell>
  );
}
