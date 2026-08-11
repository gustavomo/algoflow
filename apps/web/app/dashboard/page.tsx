import Link from 'next/link';
import AppShell from '../../components/layout/AppShell';
import NotificationSettings from '../../components/learning/NotificationSettings';
import { getCatalog, getDashboard } from '../../lib/server/learningData';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const [{ snapshot, recommendation }, { learningPaths, lessons }] =
    await Promise.all([getDashboard(), getCatalog()]);
  const lessonBySlug = new Map(lessons.map((lesson) => [lesson.slug, lesson]));
  const completed = new Set(
    snapshot.progress
      .filter((item) => item.status === 'completed')
      .map((item) => item.lessonSlug),
  );
  const dueCount = snapshot.reviews.filter(
    (review) => new Date(review.dueAt) <= new Date(),
  ).length;
  const focusedPath = snapshot.focusedPathSlug
    ? learningPaths.find((path) => path.slug === snapshot.focusedPathSlug)
    : undefined;
  const featuredPaths = [
    focusedPath,
    learningPaths.find((path) => path.slug === 'algorithm-foundations'),
    learningPaths.find(
      (path) => path.slug === 'software-engineering-fundamentals',
    ),
    learningPaths.find(
      (path) => path.slug === 'artificial-intelligence-foundations',
    ),
    learningPaths.find((path) => path.slug === 'staff-engineer'),
  ]
    .filter((path, index, items) => {
      if (!path) return false;
      return (
        items.findIndex((candidate) => candidate?.slug === path.slug) === index
      );
    })
    .slice(0, 4);

  return (
    <AppShell>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-ink">
            Personal learning system
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">
            What should you learn next?
          </h1>
        </div>
        <p className="text-sm text-subtle">
          Server progress · {completed.size} lessons complete
        </p>
      </div>

      <section className="mt-10 grid gap-5 lg:grid-cols-[1.35fr_.65fr]">
        <div className="rounded-3xl border border-line-strong bg-surface-raised p-7">
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-ink">
            Recommended now
          </p>
          <h2 className="mt-4 text-3xl font-semibold capitalize">
            {recommendation.title}
          </h2>
          <p className="mt-2 text-muted">{recommendation.detail}</p>
          <Link
            href={recommendation.href}
            className="mt-7 inline-flex rounded-xl bg-action px-5 py-3 font-semibold text-canvas hover:bg-action-hover"
          >
            {recommendation.kind === 'review'
              ? 'Start review'
              : 'Continue learning'}
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-1">
          <div className="rounded-2xl border border-line bg-surface p-5">
            <p className="text-sm text-subtle">Due reviews</p>
            <p className="mt-2 text-3xl font-semibold text-warning">
              {dueCount}
            </p>
          </div>
          <div className="rounded-2xl border border-line bg-surface p-5">
            <p className="text-sm text-subtle">Assessment attempts</p>
            <p className="mt-2 text-3xl font-semibold text-ink-soft">
              {snapshot.attempts.length}
            </p>
          </div>
        </div>
      </section>

      <section className="mt-12">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Learning paths</h2>
          <Link href="/paths" className="text-sm text-ink">
            View all
          </Link>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {featuredPaths.map((path) => {
            if (!path) return null;
            const completeCount = path.lessonSlugs.filter((slug) =>
              completed.has(slug),
            ).length;
            const percent = path.lessonSlugs.length
              ? Math.round((completeCount / path.lessonSlugs.length) * 100)
              : 0;
            return (
              <Link
                key={path.slug}
                href={`/paths/${path.slug}`}
                className="rounded-2xl border border-line bg-surface p-5 transition hover:-translate-y-0.5 hover:border-line-strong"
              >
                <p className="font-medium">{path.title}</p>
                {snapshot.focusedPathSlug === path.slug && (
                  <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.18em] text-ink">
                    Focused path
                  </p>
                )}
                <p className="mt-2 text-sm leading-6 text-subtle">
                  {path.description}
                </p>
                <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-surface-raised">
                  <div
                    className="h-full rounded-full bg-action"
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-subtle">
                  {percent}% available ·{' '}
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
      </section>

      <section className="mt-12 grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-line bg-surface p-6">
          <h2 className="font-semibold">Recently completed</h2>
          <div className="mt-4 space-y-3">
            {snapshot.progress
              .filter((item) => item.status === 'completed')
              .slice(0, 3)
              .map((item) => (
                <Link
                  key={item.lessonSlug}
                  href={`/lessons/${item.lessonSlug}`}
                  className="flex justify-between rounded-xl bg-canvas/60 px-4 py-3 text-sm"
                >
                  <span>
                    {lessonBySlug.get(item.lessonSlug)?.title ??
                      item.lessonSlug}
                  </span>
                  <span className="text-success">Complete</span>
                </Link>
              ))}
            {!snapshot.progress.some((item) => item.status === 'completed') && (
              <p className="text-sm text-subtle">
                Your first completion will appear here.
              </p>
            )}
          </div>
        </div>
        <NotificationSettings
          initialPreferences={snapshot.notificationPreferences}
        />
      </section>
    </AppShell>
  );
}
