import Link from 'next/link';
import AppShell from '../../components/layout/AppShell';
import { getCatalog, getLearningSnapshot } from '../../lib/server/learningData';

export const dynamic = 'force-dynamic';

export default async function TopicsPage() {
  const [{ lessons, topics }, snapshot] = await Promise.all([
    getCatalog(),
    getLearningSnapshot(),
  ]);
  const completed = new Set(
    snapshot.progress
      .filter((item) => item.status === 'completed')
      .map((item) => item.lessonSlug),
  );
  return (
    <AppShell>
      <p className="font-mono text-xs uppercase tracking-[0.28em] text-ink">
        Curriculum map
      </p>
      <h1 className="mt-3 text-4xl font-semibold">Topics</h1>
      <p className="mt-3 max-w-2xl text-muted">
        Choose an area to inspect its concepts, lessons, and current mastery.
      </p>
      <div className="mt-10 grid gap-5 md:grid-cols-2">
        {topics.map((topic) => {
          const topicLessons = lessons.filter(
            (lesson) => lesson.topicSlug === topic.slug,
          );
          const done = topicLessons.filter((lesson) =>
            completed.has(lesson.slug),
          ).length;
          return (
            <Link
              key={topic.slug}
              href={`/topics/${topic.slug}`}
              className="group rounded-3xl border border-line bg-surface p-7 transition hover:border-line-strong"
            >
              <div className="flex items-start justify-between gap-6">
                <h2 className="text-2xl font-semibold">{topic.title}</h2>
                <span className="font-mono text-xs text-subtle">
                  {done}/{topicLessons.length}
                </span>
              </div>
              <p className="mt-3 leading-7 text-muted">{topic.description}</p>
              <p className="mt-6 text-sm text-ink group-hover:text-ink">
                Explore topic →
              </p>
            </Link>
          );
        })}
      </div>
    </AppShell>
  );
}
