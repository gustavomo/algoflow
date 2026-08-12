import Link from 'next/link';
import { notFound } from 'next/navigation';
import AppShell from '../../../components/layout/AppShell';
import {
  getCatalog,
  getLearningSnapshot,
} from '../../../lib/server/learningData';

export const dynamic = 'force-dynamic';

export default async function TopicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [{ topics, lessons }, snapshot] = await Promise.all([
    getCatalog(),
    getLearningSnapshot(),
  ]);
  const topicBySlug = new Map(topics.map((topic) => [topic.slug, topic]));
  const topic = topicBySlug.get(slug);
  if (!topic) notFound();
  const progress = new Map(
    snapshot.progress.map((item) => [item.lessonSlug, item]),
  );
  const topicLessons = lessons.filter(
    (lesson) => lesson.topicSlug === topic.slug,
  );
  return (
    <AppShell>
      <Link href="/topics" className="text-sm text-subtle hover:text-white">
        ← All topics
      </Link>
      <p className="mt-8 font-mono text-xs uppercase tracking-[0.28em] text-ink">
        Topic
      </p>
      <h1 className="mt-3 text-4xl font-semibold">{topic.title}</h1>
      <p className="mt-3 max-w-2xl leading-7 text-muted">{topic.description}</p>
      <div className="mt-10 border-y border-line">
        {topicLessons.map((lesson, index) => {
          const state = progress.get(lesson.slug);
          return (
            <Link
              key={lesson.slug}
              href={`/lessons/${lesson.slug}`}
              className="group flex flex-col gap-4 border-b border-line py-6 transition last:border-b-0 sm:flex-row sm:items-center"
            >
              <span className="font-mono text-xs text-faint">
                {String(index + 1).padStart(2, '0')}
              </span>
              <div className="flex-1">
                <h2 className="font-semibold transition group-hover:translate-x-1">
                  {lesson.title}
                </h2>
                <p className="mt-1 text-sm text-subtle">{lesson.summary}</p>
              </div>
              <div className="text-xs text-subtle">
                {lesson.tech.toUpperCase()} · {lesson.estimatedMinutes} min ·{' '}
                <span
                  className={
                    state?.status === 'completed' ? 'text-success' : ''
                  }
                >
                  {state?.status ?? 'not started'}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
      {topic.assessmentSlug && (
        <section className="mt-12 grid gap-5 border-y border-line py-7 sm:grid-cols-[1fr_auto] sm:items-center">
          <div>
            <p className="eyebrow">Topic synthesis</p>
            <h2 className="mt-3 text-xl font-semibold">
              Transfer the model across lesson boundaries.
            </h2>
            <p className="mt-2 text-sm leading-6 text-subtle">
              This checkpoint combines recall, application, debugging,
              teach-back, and an exam or interview variant.
            </p>
          </div>
          <Link
            href={`/assessments/${topic.assessmentSlug}`}
            className="button-primary px-5 py-3 text-center text-sm"
          >
            Open synthesis →
          </Link>
        </section>
      )}
    </AppShell>
  );
}
