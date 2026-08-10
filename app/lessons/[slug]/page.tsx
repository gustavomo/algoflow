import type { ReactNode } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import LazyCodeEditor from '../../../components/editor/LazyCodeEditor';
import AppShell from '../../../components/layout/AppShell';
import LessonActions from '../../../components/lesson/LessonActions';
import LessonVizPlayer from '../../../components/lesson/LessonVizPlayer';
import QABox from '../../../components/lesson/QABox';
import { lessonBySlug, topicBySlug } from '../../../lib/content/catalog';
import { lessonContentBySlug } from '../../../lib/content/lessonContent';

function Hint({ children }: { children?: ReactNode }) {
  return (
    <aside className="my-6 rounded-xl border border-amber-300/20 bg-amber-300/[0.06] p-4 text-sm leading-6 text-amber-100">
      <span className="mr-2 font-mono text-[10px] uppercase tracking-[0.18em] text-amber-300">
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
  const lesson = lessonBySlug.get(slug);
  if (!lesson) notFound();
  const LessonContent = lessonContentBySlug[slug];
  if (!LessonContent) notFound();
  const topic = topicBySlug.get(lesson.topicSlug)!;

  return (
    <AppShell>
      <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
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
      <div className="mt-8 grid gap-10 xl:grid-cols-[minmax(0,.86fr)_minmax(520px,1.14fr)]">
        <article>
          <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.22em] text-cyan-300">
            <span>{lesson.tech}</span>
            <span className="text-slate-700">·</span>
            <span>{lesson.estimatedMinutes} min</span>
          </div>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight">
            {lesson.title}
          </h1>
          <p className="mt-4 text-lg leading-8 text-slate-400">
            {lesson.summary}
          </p>
          <div className="lesson-copy mt-10">
            <LessonContent components={{ Hint }} />
          </div>
          <LessonActions lesson={lesson} />
          <div className="mt-10">
            <h2 className="text-xl font-semibold">Try the idea</h2>
            <p className="mt-2 text-sm text-slate-500">
              Monaco runs only in the client and keeps editing separate from the
              lesson renderer.
            </p>
            <div className="mt-4">
              <LazyCodeEditor
                language={
                  lesson.tech === 'go'
                    ? 'go'
                    : lesson.tech === 'ts'
                      ? 'typescript'
                      : 'javascript'
                }
              />
            </div>
          </div>
          <QABox tech={lesson.tech} lessonSlug={lesson.slug} />
        </article>
        <section className="xl:sticky xl:top-28 xl:self-start">
          <LessonVizPlayer slug={lesson.slug} />
        </section>
      </div>
    </AppShell>
  );
}
