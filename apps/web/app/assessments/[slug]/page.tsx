import Link from 'next/link';
import { notFound } from 'next/navigation';
import AppShell from '../../../components/layout/AppShell';
import AssessmentPanel from '../../../components/learning/AssessmentPanel';
import { getCatalog } from '../../../lib/server/learningData';

export default async function AssessmentPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { assessments, lessons } = await getCatalog();
  const assessmentBySlug = new Map(
    assessments.map((assessment) => [assessment.slug, assessment]),
  );
  const lessonBySlug = new Map(lessons.map((lesson) => [lesson.slug, lesson]));
  const assessment = assessmentBySlug.get(slug);
  if (!assessment) notFound();
  const lesson = assessment.lessonSlug
    ? lessonBySlug.get(assessment.lessonSlug)
    : undefined;
  const scope = assessment.scope ?? {
    kind: 'lesson' as const,
    slug: assessment.lessonSlug ?? '',
  };
  const backHref =
    scope.kind === 'topic'
      ? `/topics/${scope.slug}`
      : scope.kind === 'path'
        ? `/paths/${scope.slug}`
        : scope.kind === 'simulation'
          ? `/simulations/${scope.slug}`
          : `/lessons/${scope.slug}`;
  const backLabel = lesson?.title ?? scope.slug.replaceAll('-', ' ');
  return (
    <AppShell>
      <Link href={backHref} className="text-sm text-subtle">
        ← Back to {backLabel}
      </Link>
      <p className="mt-8 font-mono text-xs uppercase tracking-[0.28em] text-ink-soft">
        {assessment.mode === 'diagnostic'
          ? 'Readiness diagnostic'
          : 'Deterministic mastery checkpoint'}
      </p>
      <h1 className="mt-3 text-4xl font-semibold">{assessment.title}</h1>
      <p className="mt-3 text-muted">
        {assessment.mode === 'diagnostic'
          ? 'This maps readiness and gaps. It does not complete planned teaching modules.'
          : 'Passing requires the score threshold and every transfer gate. AI never decides correctness.'}
      </p>
      <div className="mt-10">
        <AssessmentPanel assessment={assessment} />
      </div>
    </AppShell>
  );
}
