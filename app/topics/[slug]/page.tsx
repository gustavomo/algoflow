import Link from 'next/link';
import { notFound } from 'next/navigation';
import AppShell from '../../../components/layout/AppShell';
import { lessons, topicBySlug } from '../../../lib/content/catalog';
import { getLearningRepository } from '../../../lib/persistence';

export const dynamic = 'force-dynamic';

export default async function TopicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const topic = topicBySlug.get(slug);
  if (!topic) notFound();
  const snapshot = await getLearningRepository().getSnapshot();
  const progress = new Map(
    snapshot.progress.map((item) => [item.lessonSlug, item]),
  );
  const topicLessons = lessons.filter(
    (lesson) => lesson.topicSlug === topic.slug,
  );
  return (
    <AppShell>
      <Link href="/topics" className="text-sm text-slate-500 hover:text-white">
        ← All topics
      </Link>
      <p className="mt-8 font-mono text-xs uppercase tracking-[0.28em] text-cyan-300">
        Topic
      </p>
      <h1 className="mt-3 text-4xl font-semibold">{topic.title}</h1>
      <p className="mt-3 max-w-2xl leading-7 text-slate-400">
        {topic.description}
      </p>
      <div className="mt-10 space-y-4">
        {topicLessons.map((lesson, index) => {
          const state = progress.get(lesson.slug);
          return (
            <Link
              key={lesson.slug}
              href={`/lessons/${lesson.slug}`}
              className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-cyan-300/30 sm:flex-row sm:items-center"
            >
              <span className="font-mono text-xs text-slate-600">
                {String(index + 1).padStart(2, '0')}
              </span>
              <div className="flex-1">
                <h2 className="font-semibold">{lesson.title}</h2>
                <p className="mt-1 text-sm text-slate-500">{lesson.summary}</p>
              </div>
              <div className="text-xs text-slate-500">
                {lesson.tech.toUpperCase()} · {lesson.estimatedMinutes} min ·{' '}
                <span
                  className={
                    state?.status === 'completed' ? 'text-emerald-300' : ''
                  }
                >
                  {state?.status ?? 'not started'}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </AppShell>
  );
}
