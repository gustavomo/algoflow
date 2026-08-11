import type { ReactNode } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import LazyCodeEditor from '../../../components/editor/LazyCodeEditor';
import AppShell from '../../../components/layout/AppShell';
import LessonActions from '../../../components/lesson/LessonActions';
import LessonVizPlayer from '../../../components/lesson/LessonVizPlayer';
import QABox from '../../../components/lesson/QABox';
import { lessonContentBySlug } from '../../../lib/lessonContent';
import { getCatalog } from '../../../lib/server/learningData';

function Hint({ children }: { children?: ReactNode }) {
  return (
    <aside className="my-7 border-l-2 border-warning py-1 pl-5 text-sm leading-6 text-ink-soft">
      <span className="mr-2 font-mono text-[10px] uppercase tracking-[0.18em] text-warning">
        Hint
      </span>
      {children}
    </aside>
  );
}

export default async function LessonPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { lessons, topics } = await getCatalog();
  const lessonBySlug = new Map(lessons.map((lesson) => [lesson.slug, lesson]));
  const topicBySlug = new Map(topics.map((topic) => [topic.slug, topic]));
  const lesson = lessonBySlug.get(slug);
  if (!lesson) notFound();
  const LessonContent = lessonContentBySlug[slug];
  if (!LessonContent) notFound();
  const topic = topicBySlug.get(lesson.topicSlug)!;

  return (
    <AppShell>
      <div className="flex flex-wrap items-center gap-2 text-sm text-subtle">
        <Link href="/lessons" className="hover:text-white">
          Lessons
        </Link>
        <span>/</span>
        <Link href={`/topics/${topic.slug}`} className="hover:text-white">
          {topic.title}
        </Link>
        <span>/</span>
        <span>{lesson.title}</span>
      </div>
      <div className="mt-8 grid min-w-0 gap-10 xl:grid-cols-[minmax(0,.86fr)_minmax(520px,1.14fr)]">
        <article className="min-w-0">
          <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.22em] text-ink">
            <span>{lesson.tech}</span>
            <span className="text-faint">·</span>
            <span>{lesson.estimatedMinutes} min</span>
          </div>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight">
            {lesson.title}
          </h1>
          <p className="mt-4 text-lg leading-8 text-muted">{lesson.summary}</p>
          <div className="lesson-copy mt-10">
            <LessonContent components={{ Hint }} />
          </div>
          <LessonActions lesson={lesson} />
          {lesson.codeLanguage && (
            <div className="mt-10">
              <h2 className="text-xl font-semibold">Try the idea</h2>
              <p className="mt-2 text-sm text-subtle">
                Monaco runs only in the client and keeps editing separate from
                the lesson renderer.
              </p>
              <div className="mt-4 min-w-0 max-w-full">
                <LazyCodeEditor language={lesson.codeLanguage} />
              </div>
            </div>
          )}
          <QABox
            tech={lesson.tech}
            domain={lesson.domain}
            lessonSlug={lesson.slug}
          />
        </article>
        <section className="order-first min-w-0 xl:order-none xl:sticky xl:top-28 xl:self-start">
          <LessonVizPlayer
            slug={lesson.slug}
            visualization={lesson.visualization}
            conceptFlow={lesson.conceptFlow}
          />
        </section>
      </div>
    </AppShell>
  );
}
