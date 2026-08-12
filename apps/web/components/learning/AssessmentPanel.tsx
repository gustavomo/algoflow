'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import type {
  AssessmentDefinition,
  AssessmentGrade,
  AssessmentQuestion,
} from '@algoflow/contracts';

type Answers = Record<string, string | string[]>;

function hasAnswer(
  question: AssessmentQuestion,
  answer: string | string[] | undefined,
) {
  if (question.kind === 'ordering' || question.kind === 'multiple-select')
    return Array.isArray(answer) && answer.length > 0;
  return typeof answer === 'string' && answer.trim().length > 0;
}

export default function AssessmentPanel({
  assessment,
}: {
  assessment: AssessmentDefinition;
}) {
  const [answers, setAnswers] = useState<Answers>({});
  const [confidence, setConfidence] = useState<Record<string, number>>({});
  const [questionIndex, setQuestionIndex] = useState(0);
  const [grade, setGrade] = useState<AssessmentGrade | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const startedAt = useMemo(() => Date.now(), []);
  const question = assessment.questions[questionIndex];
  const answer = question ? answers[question.id] : undefined;
  const complete = question ? hasAnswer(question, answer) : false;

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
          confidence,
          durationSeconds: Math.round((Date.now() - startedAt) / 1000),
        }),
      });
      const body = await response.json();
      if (!response.ok)
        throw new Error(
          body.error?.message || 'Could not grade this checkpoint.',
        );
      setGrade(body.grade);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Could not grade this checkpoint.',
      );
    } finally {
      setLoading(false);
    }
  }

  if (grade) {
    const failedResults = new Map(
      grade.results
        .filter((result) => !result.correct)
        .map((result) => [result.questionId, result]),
    );
    const remediation = assessment.questions.filter((item) =>
      failedResults.has(item.id),
    );
    return (
      <section className="border-y border-line py-8">
        <div className="grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)]">
          <div className="border-r border-line pr-8">
            <p className="eyebrow">
              {grade.diagnostic
                ? 'Diagnostic recorded'
                : grade.passed
                  ? 'Mastery demonstrated'
                  : 'More evidence required'}
            </p>
            <p className="mt-5 text-6xl font-semibold tracking-tight">
              {grade.score}
            </p>
            <p className="mt-1 text-sm text-subtle">weighted score / 100</p>
            <div className="mt-7 space-y-2 font-mono text-[10px] uppercase tracking-wider">
              <p className={grade.scorePassed ? 'text-success' : 'text-danger'}>
                {grade.scorePassed ? '✓' : '×'} score threshold
              </p>
              {!grade.diagnostic && (
                <p
                  className={grade.gatesPassed ? 'text-success' : 'text-danger'}
                >
                  {grade.gatesPassed ? '✓' : '×'} transfer gates
                </p>
              )}
              {grade.diagnostic && (
                <p className="text-warning">readiness only · no completion</p>
              )}
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-semibold">
              {grade.diagnostic
                ? 'Use this map to choose where to begin.'
                : grade.passed
                  ? 'You crossed both the score and transfer boundary.'
                  : 'Review the missing evidence, then solve a fresh variant.'}
            </h2>
            {grade.missingRequiredIntents.length > 0 && (
              <p className="mt-4 border-l-2 border-danger pl-4 text-sm leading-6 text-ink-soft">
                Missing critical evidence:{' '}
                {grade.missingRequiredIntents.join(', ')}.
              </p>
            )}
            <div className="mt-8 grid gap-x-6 gap-y-4 sm:grid-cols-2">
              {grade.intentEvidence.map((evidence) => (
                <div
                  key={evidence.intent}
                  className="border-t border-line pt-3"
                >
                  <div className="flex justify-between font-mono text-[10px] uppercase tracking-wider text-subtle">
                    <span>{evidence.intent}</span>
                    <span>
                      {evidence.correctCount}/{evidence.totalCount}
                    </span>
                  </div>
                  <div className="mt-2 h-1 bg-line">
                    <div
                      className="h-full bg-action"
                      style={{
                        width: `${evidence.available ? (evidence.earned / evidence.available) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-line">
          {assessment.questions.map((item, index) => {
            const result = grade.results.find(
              (candidate) => candidate.questionId === item.id,
            )!;
            return (
              <details
                key={item.id}
                className="border-b border-line py-4"
                open={!result.correct}
              >
                <summary className="flex cursor-pointer list-none items-start gap-4">
                  <span
                    className={`font-mono text-xs ${result.correct ? 'text-success' : 'text-danger'}`}
                  >
                    {result.correct ? '✓' : '×'}{' '}
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="flex-1 text-sm text-ink-soft">
                    {item.prompt}
                  </span>
                  <span className="eyebrow">{result.intent}</span>
                </summary>
                <p className="ml-12 mt-3 text-sm leading-6 text-muted">
                  {result.explanation}
                </p>
              </details>
            );
          })}
        </div>

        {remediation.length > 0 && (
          <div className="mt-8 border-l-2 border-warning pl-5">
            <p className="eyebrow text-warning">Targeted remediation</p>
            <div className="mt-3 flex flex-wrap gap-4 text-sm">
              {Array.from(
                new Map(
                  remediation
                    .filter((item) => item.remediationHref)
                    .map((item) => [item.remediationHref, item]),
                ).values(),
              ).map((item) => (
                <Link
                  key={item.remediationHref}
                  href={item.remediationHref!}
                  className="text-ink underline underline-offset-4"
                >
                  Review {item.conceptIds[0].replaceAll('-', ' ')} →
                </Link>
              ))}
            </div>
          </div>
        )}
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/review" className="button-primary px-4 py-3 text-sm">
            Open spaced review
          </Link>
          <button
            onClick={() => {
              setGrade(null);
              setAnswers({});
              setConfidence({});
              setQuestionIndex(0);
            }}
            className="button-secondary px-4 py-3 text-sm"
          >
            Retry fresh
          </button>
        </div>
      </section>
    );
  }

  if (!question) return null;
  return (
    <section className="border-y border-line py-6">
      <div className="grid gap-8 lg:grid-cols-[180px_minmax(0,1fr)]">
        <aside className="lg:border-r lg:border-line lg:pr-6">
          <p className="eyebrow">Evidence progress</p>
          <p className="mt-3 font-mono text-sm text-ink">
            {String(questionIndex + 1).padStart(2, '0')} /{' '}
            {String(assessment.questions.length).padStart(2, '0')}
          </p>
          <div className="mt-5 flex gap-1 lg:flex-col">
            {assessment.questions.map((item, index) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setQuestionIndex(index)}
                aria-label={`Open question ${index + 1}`}
                className={`h-1 flex-1 lg:h-auto lg:border-l-2 lg:py-2 lg:pl-3 lg:text-left lg:font-mono lg:text-[10px] lg:uppercase ${
                  index === questionIndex
                    ? 'bg-action lg:border-ink lg:bg-transparent lg:text-ink'
                    : hasAnswer(item, answers[item.id])
                      ? 'bg-success lg:border-success lg:bg-transparent lg:text-success'
                      : 'bg-line lg:border-line lg:bg-transparent lg:text-faint'
                }`}
              >
                <span className="hidden lg:inline">
                  {item.intent ?? 'recall'}
                </span>
              </button>
            ))}
          </div>
        </aside>
        <div>
          <div className="flex flex-wrap gap-3 font-mono text-[9px] uppercase tracking-[0.18em] text-subtle">
            <span>{question.intent ?? 'recall'}</span>
            <span>·</span>
            <span>{question.difficulty ?? 'foundation'}</span>
            <span>·</span>
            <span>{question.transferLevel ?? 'familiar'} transfer</span>
            <span>·</span>
            <span>{question.weight ?? 1} weight</span>
          </div>
          <h2 className="mt-5 max-w-3xl text-2xl font-medium leading-9">
            {question.prompt}
          </h2>
          <div className="mt-8 max-w-3xl">
            {question.kind === 'multiple-choice' && (
              <div className="divide-y divide-line border-y border-line">
                {question.options.map((option, index) => (
                  <label
                    key={option}
                    className="flex min-h-14 cursor-pointer items-center gap-4 py-3"
                  >
                    <input
                      type="radio"
                      name={question.id}
                      value={option}
                      checked={answer === option}
                      onChange={() =>
                        setAnswers((current) => ({
                          ...current,
                          [question.id]: option,
                        }))
                      }
                    />
                    <span className="font-mono text-[10px] text-faint">
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span className="text-sm text-ink-soft">{option}</span>
                  </label>
                ))}
              </div>
            )}
            {question.kind === 'multiple-select' && (
              <div className="divide-y divide-line border-y border-line">
                {question.options.map((option) => {
                  const selected =
                    Array.isArray(answer) && answer.includes(option);
                  return (
                    <label
                      key={option}
                      className="flex min-h-14 cursor-pointer items-center gap-4 py-3"
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() =>
                          setAnswers((current) => {
                            const values = Array.isArray(current[question.id])
                              ? (current[question.id] as string[])
                              : [];
                            return {
                              ...current,
                              [question.id]: selected
                                ? values.filter((value) => value !== option)
                                : [...values, option],
                            };
                          })
                        }
                      />
                      <span className="text-sm text-ink-soft">{option}</span>
                    </label>
                  );
                })}
              </div>
            )}
            {(question.kind === 'short-answer' ||
              question.kind === 'text' ||
              question.kind === 'numeric-range') && (
              <input
                value={typeof answer === 'string' ? answer : ''}
                inputMode={
                  question.kind === 'numeric-range' ? 'decimal' : 'text'
                }
                onChange={(event) =>
                  setAnswers((current) => ({
                    ...current,
                    [question.id]: event.target.value,
                  }))
                }
                className="w-full border-b border-line-strong bg-transparent px-1 py-4 text-lg outline-none focus:border-ink"
                placeholder={
                  question.kind === 'numeric-range'
                    ? `Value${question.unit ? ` in ${question.unit}` : ''}`
                    : 'Type the canonical term'
                }
              />
            )}
            {question.kind === 'ordering' && (
              <div className="space-y-3 border-y border-line py-4">
                {question.correctAnswer.map((_, orderIndex) => (
                  <label
                    key={orderIndex}
                    className="grid grid-cols-[90px_1fr] items-center gap-3"
                  >
                    <span className="font-mono text-[10px] uppercase text-faint">
                      Position {orderIndex + 1}
                    </span>
                    <select
                      value={
                        (Array.isArray(answer) ? answer[orderIndex] : '') ?? ''
                      }
                      onChange={(event) =>
                        setAnswers((current) => {
                          const next = Array.isArray(current[question.id])
                            ? [...(current[question.id] as string[])]
                            : [];
                          next[orderIndex] = event.target.value;
                          return { ...current, [question.id]: next };
                        })
                      }
                      className="border border-line bg-surface px-4 py-3"
                    >
                      <option value="">Choose stage</option>
                      {question.options.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="mt-8 border-t border-line pt-5">
            <p className="eyebrow">Confidence before feedback</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={confidence[question.id] === value}
                  onClick={() =>
                    setConfidence((current) => ({
                      ...current,
                      [question.id]: value,
                    }))
                  }
                  className={`h-9 w-9 border font-mono text-xs ${confidence[question.id] === value ? 'border-ink bg-action text-canvas' : 'border-line text-subtle'}`}
                >
                  {value}
                </button>
              ))}
              <span className="ml-2 text-xs text-faint">
                guess → can teach it
              </span>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <p
          role="alert"
          className="mt-5 border-l-2 border-danger pl-3 text-sm text-danger"
        >
          {error}
        </p>
      )}
      <div className="mt-8 flex items-center justify-between border-t border-line pt-5">
        <button
          type="button"
          disabled={questionIndex === 0}
          onClick={() => setQuestionIndex((index) => Math.max(0, index - 1))}
          className="button-secondary px-4 py-2 text-sm"
        >
          Previous
        </button>
        {questionIndex < assessment.questions.length - 1 ? (
          <button
            type="button"
            disabled={!complete}
            onClick={() => setQuestionIndex((index) => index + 1)}
            className="button-primary px-5 py-2 text-sm"
          >
            Next evidence
          </button>
        ) : (
          <button
            disabled={
              loading ||
              assessment.questions.some(
                (item) => !hasAnswer(item, answers[item.id]),
              )
            }
            onClick={submit}
            className="button-primary px-5 py-2 text-sm"
          >
            {loading
              ? 'Grading…'
              : assessment.mode === 'diagnostic'
                ? 'Map readiness'
                : 'Grade mastery'}
          </button>
        )}
      </div>
    </section>
  );
}
