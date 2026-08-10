import Link from 'next/link';
import { notFound } from 'next/navigation';
import AppShell from '../../../components/layout/AppShell';
import AssessmentPanel from '../../../components/learning/AssessmentPanel';
import { assessmentBySlug, lessonBySlug } from '../../../lib/content/catalog';

export default async function AssessmentPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const assessment = assessmentBySlug.get(slug);
  if (!assessment) notFound();
  const lesson = lessonBySlug.get(assessment.lessonSlug)!;
  return (
    <AppShell>
      <Link href={`/lessons/${lesson.slug}`} className="text-sm text-slate-500">
        ← Back to {lesson.title}
      </Link>
      <p className="mt-8 font-mono text-xs uppercase tracking-[0.28em] text-violet-300">
        Deterministic assessment
      </p>
      <h1 className="mt-3 text-4xl font-semibold">{assessment.title}</h1>
      <p className="mt-3 text-slate-400">
        AI never decides whether an answer is correct. It can explain the result
        after grading.
      </p>
      <div className="mt-10">
        <AssessmentPanel assessment={assessment} />
      </div>
    </AppShell>
  );
}
