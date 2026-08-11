import Link from 'next/link';
import type { LessonDefinition } from '@algoflow/contracts';

export default function LessonActions({
  lesson,
}: {
  lesson: LessonDefinition;
}) {
  return (
    <section className="mt-12 border-y border-line py-6">
      <p className="eyebrow">Mastery boundary</p>
      <div className="mt-4 grid gap-5 sm:grid-cols-[1fr_auto] sm:items-center">
        <div>
          <h2 className="text-xl font-semibold">Viewing is not completion.</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-subtle">
            Demonstrate recall, application, debugging, teach-back, and
            transfer. The lesson completes only when the weighted score and
            every critical gate pass.
          </p>
          <p className="mt-3 font-mono text-[10px] uppercase tracking-wider text-faint">
            Concepts · {lesson.conceptIds.join(' · ')}
          </p>
        </div>
        <Link
          href={`/assessments/${lesson.assessmentSlug}`}
          className="button-primary px-5 py-3 text-center text-sm"
        >
          Prove mastery →
        </Link>
      </div>
    </section>
  );
}
