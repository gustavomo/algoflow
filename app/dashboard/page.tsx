import Link from 'next/link';
import AppShell from '../../components/layout/AppShell';
import NotificationSettings from '../../components/learning/NotificationSettings';
import { learningPaths, lessonBySlug } from '../../lib/content/catalog';
import { recommendNextActivity } from '../../lib/learning/recommendation';
import { getLearningRepository } from '../../lib/persistence';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const snapshot = await getLearningRepository().getSnapshot();
  const recommendation = recommendNextActivity(
    snapshot.progress,
    snapshot.reviews,
  );
  const completed = new Set(
    snapshot.progress
      .filter((item) => item.status === 'completed')
      .map((item) => item.lessonSlug),
  );
  const dueCount = snapshot.reviews.filter(
    (review) => new Date(review.dueAt) <= new Date(),
  ).length;

  return (
    <AppShell>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-cyan-300">
            Personal learning system
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">
            What should you learn next?
          </h1>
        </div>
        <p className="text-sm text-slate-500">
          Server progress · {completed.size} lessons complete
        </p>
      </div>

      <section className="mt-10 grid gap-5 lg:grid-cols-[1.35fr_.65fr]">
        <div className="rounded-3xl border border-cyan-300/20 bg-cyan-300/[0.06] p-7">
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-cyan-300">
            Recommended now
          </p>
          <h2 className="mt-4 text-3xl font-semibold capitalize">
            {recommendation.title}
          </h2>
          <p className="mt-2 text-slate-400">{recommendation.detail}</p>
          <Link
            href={recommendation.href}
            className="mt-7 inline-flex rounded-xl bg-cyan-300 px-5 py-3 font-semibold text-slate-950 hover:bg-cyan-200"
          >
            {recommendation.kind === 'review'
              ? 'Start review'
              : 'Continue learning'}
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-1">
          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
            <p className="text-sm text-slate-500">Due reviews</p>
            <p className="mt-2 text-3xl font-semibold text-amber-300">
              {dueCount}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
            <p className="text-sm text-slate-500">Assessment attempts</p>
            <p className="mt-2 text-3xl font-semibold text-violet-300">
              {snapshot.attempts.length}
            </p>
          </div>
        </div>
      </section>

      <section className="mt-12">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Learning paths</h2>
          <Link href="/paths" className="text-sm text-cyan-300">
            View all
          </Link>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {learningPaths.map((path) => {
            const completeCount = path.lessonSlugs.filter((slug) =>
              completed.has(slug),
            ).length;
            const percent = Math.round(
              (completeCount / path.lessonSlugs.length) * 100,
            );
            return (
              <Link
                key={path.slug}
                href={`/paths/${path.slug}`}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:-translate-y-0.5 hover:border-cyan-300/30"
              >
                <p className="font-medium">{path.title}</p>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {path.description}
                </p>
                <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-cyan-300"
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  {percent}% · {path.estimatedMinutes} min
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mt-12 grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="font-semibold">Recently completed</h2>
          <div className="mt-4 space-y-3">
            {snapshot.progress
              .filter((item) => item.status === 'completed')
              .slice(0, 3)
              .map((item) => (
                <Link
                  key={item.lessonSlug}
                  href={`/lessons/${item.lessonSlug}`}
                  className="flex justify-between rounded-xl bg-black/15 px-4 py-3 text-sm"
                >
                  <span>
                    {lessonBySlug.get(item.lessonSlug)?.title ??
                      item.lessonSlug}
                  </span>
                  <span className="text-emerald-300">Complete</span>
                </Link>
              ))}
            {!snapshot.progress.some((item) => item.status === 'completed') && (
              <p className="text-sm text-slate-500">
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
