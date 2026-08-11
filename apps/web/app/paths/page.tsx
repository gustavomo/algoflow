import Link from 'next/link';
import AppShell from '../../components/layout/AppShell';
import { getCatalog, getLearningSnapshot } from '../../lib/server/learningData';

export const dynamic = 'force-dynamic';

export default async function PathsPage() {
  const [{ learningPaths, tracks }, snapshot] = await Promise.all([
    getCatalog(),
    getLearningSnapshot(),
  ]);
  const completed = new Set(
    snapshot.progress
      .filter((item) => item.status === 'completed')
      .map((item) => item.lessonSlug),
  );
  const pathBySlug = new Map(learningPaths.map((path) => [path.slug, path]));

  return (
    <AppShell>
      <p className="eyebrow text-ink">{tracks.length} learning tracks</p>
      <h1 className="mt-3 text-4xl font-semibold">Your learning roadmap</h1>
      <p className="mt-3 max-w-3xl text-muted">
        Available lessons are ready now. Planned modules show where each path
        grows next without inflating your progress.
      </p>
      <div className="mt-12 space-y-14">
        {tracks.map((track) => {
          const paths = track.pathSlugs
            .map((slug) => pathBySlug.get(slug))
            .filter(Boolean);
          return (
            <section key={track.slug} aria-labelledby={`${track.slug}-title`}>
              <div className="flex flex-col gap-3 border-b border-line pb-5 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="eyebrow">
                    Track {String(track.order).padStart(2, '0')}
                  </p>
                  <h2
                    id={`${track.slug}-title`}
                    className="mt-2 text-2xl font-semibold"
                  >
                    {track.title}
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-subtle">
                    {track.description}
                  </p>
                </div>
                <Link
                  href={`/tracks/${track.slug}`}
                  className="text-sm text-ink"
                >
                  View track →
                </Link>
              </div>
              <div className="mt-5 grid gap-4 lg:grid-cols-3">
                {paths.map((path) => {
                  if (!path) return null;
                  const done = path.lessonSlugs.filter((slug) =>
                    completed.has(slug),
                  ).length;
                  const planned = path.modules.filter(
                    (module) => module.status === 'planned',
                  ).length;
                  const practice = path.modules.filter(
                    (module) => module.status === 'practice',
                  ).length;
                  const focused = snapshot.focusedPathSlug === path.slug;
                  return (
                    <Link
                      key={path.slug}
                      href={`/paths/${path.slug}`}
                      className={`rounded-2xl border bg-surface p-6 transition hover:-translate-y-0.5 hover:border-line-strong ${focused ? 'border-line-strong' : 'border-line'}`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="eyebrow">{path.level}</span>
                        {focused && (
                          <span className="rounded-full border border-line-strong px-2 py-1 text-[9px] uppercase tracking-wider">
                            Focused
                          </span>
                        )}
                      </div>
                      <h3 className="mt-4 text-xl font-semibold">
                        {path.title}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-subtle">
                        {path.description}
                      </p>
                      <p className="mt-5 text-xs text-muted">
                        {done}/{path.lessonSlugs.length} lessons · {practice}{' '}
                        labs · {planned} planned
                      </p>
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </AppShell>
  );
}
