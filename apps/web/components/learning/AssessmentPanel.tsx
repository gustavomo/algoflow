'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import type {
  AssessmentDefinition,
  AssessmentGrade,
} from '@algoflow/contracts';

export default function AssessmentPanel({
  assessment,
}: {
  assessment: AssessmentDefinition;
}) {
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [grade, setGrade] = useState<AssessmentGrade | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const startedAt = useMemo(() => Date.now(), []);

  async function submit() {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assessmentSlug: assessment.slug,
          answers,
          durationSeconds: Math.round((Date.now() - startedAt) / 1000),
        }),
      });
      const body = await response.json();
      if (!response.ok)
        throw new Error(
          body.error?.message || 'Could not grade this assessment.',
        );
      setGrade(body.grade);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Could not grade this assessment.',
      );
    } finally {
      setLoading(false);
    }
  }

  if (grade) {
    return (
      <div className="rounded-3xl border border-line bg-surface p-7">
        <p className="font-mono text-xs uppercase tracking-[0.24em] text-ink">
          Attempt recorded
        </p>
        <div className="mt-5 flex items-end gap-3">
          <span className="text-6xl font-semibold">{grade.score}</span>
          <span className="pb-2 text-subtle">/ 100</span>
        </div>
        <p className={`mt-3 ${grade.passed ? 'text-success' : 'text-warning'}`}>
          {grade.passed
            ? 'Checkpoint passed.'
            : 'Review the missed concepts and try again.'}
        </p>
        <div className="mt-7 space-y-3">
          {grade.results.map((result) => (
            <div
              key={result.questionId}
              className="rounded-xl bg-canvas/60 p-4"
            >
              <p className={result.correct ? 'text-success' : 'text-danger'}>
                {result.correct ? 'Correct' : 'Needs review'}
              </p>
              <p className="mt-1 text-sm text-muted">{result.explanation}</p>
            </div>
          ))}
        </div>
        <div className="mt-7 flex gap-3">
          <Link
            href="/review"
            className="rounded-xl bg-action px-4 py-2 font-semibold text-canvas"
          >
            Open reviews
          </Link>
          <button
            onClick={() => setGrade(null)}
            className="rounded-xl border border-line-strong px-4 py-2"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {assessment.questions.map((question, index) => (
        <fieldset
          key={question.id}
          className="rounded-2xl border border-line bg-surface p-6"
        >
          <legend className="px-2 font-medium">
            <span className="mr-3 font-mono text-xs text-faint">
              {String(index + 1).padStart(2, '0')}
            </span>
            {question.prompt}
          </legend>
          {question.kind === 'multiple-choice' && (
            <div className="mt-5 grid gap-2">
              {question.options?.map((option) => (
                <label
                  key={option}
                  className="flex cursor-pointer gap-3 rounded-xl border border-line p-3 hover:bg-surface"
                >
                  <input
                    type="radio"
                    name={question.id}
                    value={option}
                    checked={answers[question.id] === option}
                    onChange={() =>
                      setAnswers((current) => ({
                        ...current,
                        [question.id]: option,
                      }))
                    }
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
          )}
          {question.kind === 'text' && (
            <input
              value={(answers[question.id] as string) ?? ''}
              onChange={(event) =>
                setAnswers((current) => ({
                  ...current,
                  [question.id]: event.target.value,
                }))
              }
              className="mt-5 w-full rounded-xl border border-line bg-canvas/60 px-4 py-3 outline-none focus:border-line-strong"
            />
          )}
          {question.kind === 'ordering' && (
            <div className="mt-5 grid gap-2">
              {question.correctAnswer.map((_, orderIndex) => (
                <select
                  key={orderIndex}
                  value={
                    (answers[question.id] as string[] | undefined)?.[
                      orderIndex
                    ] ?? ''
                  }
                  onChange={(event) =>
                    setAnswers((current) => {
                      const next = [
                        ...((current[question.id] as string[] | undefined) ??
                          []),
                      ];
                      next[orderIndex] = event.target.value;
                      return { ...current, [question.id]: next };
                    })
                  }
                  className="rounded-xl border border-line bg-surface px-4 py-3"
                >
                  <option value="">Position {orderIndex + 1}</option>
                  {question.options.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              ))}
            </div>
          )}
        </fieldset>
      ))}
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      <button
        disabled={loading}
        onClick={submit}
        className="rounded-xl bg-action px-5 py-3 font-semibold text-canvas hover:bg-action-hover disabled:opacity-60"
      >
        {loading ? 'Grading…' : 'Submit checkpoint'}
      </button>
    </div>
  );
}
