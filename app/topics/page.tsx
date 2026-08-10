import Link from 'next/link';
import AppShell from '../../components/layout/AppShell';
import { lessons, topics } from '../../lib/content/catalog';
import { getLearningRepository } from '../../lib/persistence';

export const dynamic = 'force-dynamic';

export default async function TopicsPage() {
  const snapshot = await getLearningRepository().getSnapshot();
  const completed = new Set(
    snapshot.progress
      .filter((item) => item.status === 'completed')
      .map((item) => item.lessonSlug),
  );
  return (
    <AppShell>
      <p className="font-mono text-xs uppercase tracking-[0.28em] text-cyan-300">
        Curriculum map
      </p>
      <h1 className="mt-3 text-4xl font-semibold">Topics</h1>
      <p className="mt-3 max-w-2xl text-slate-400">
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
              className="group rounded-3xl border border-white/10 bg-white/[0.035] p-7 transition hover:border-cyan-300/30"
            >
              <div className="flex items-start justify-between gap-6">
                <h2 className="text-2xl font-semibold">{topic.title}</h2>
                <span className="font-mono text-xs text-slate-500">
                  {done}/{topicLessons.length}
                </span>
              </div>
              <p className="mt-3 leading-7 text-slate-400">
                {topic.description}
              </p>
              <p className="mt-6 text-sm text-cyan-300 group-hover:text-cyan-200">
                Explore topic →
              </p>
            </Link>
          );
        })}
      </div>
    </AppShell>
  );
}
