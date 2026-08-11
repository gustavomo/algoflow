'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { ReviewRating, ReviewState } from '@algoflow/contracts';

const ratings: { value: ReviewRating; label: string; tone: string }[] = [
  { value: 'again', label: 'Again', tone: 'border-danger/40 text-danger' },
  { value: 'hard', label: 'Hard', tone: 'border-line-strong text-warning' },
  { value: 'good', label: 'Good', tone: 'border-line-strong text-ink' },
  {
    value: 'easy',
    label: 'Easy',
    tone: 'border-success/40 text-success',
  },
];

export default function ReviewQueue({
  initialReviews,
}: {
  initialReviews: ReviewState[];
}) {
  const [reviews, setReviews] = useState(initialReviews);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [revealed, setRevealed] = useState(false);
  const current = reviews[0];

  async function rate(rating: ReviewRating) {
    if (!current) return;
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conceptId: current.conceptId, rating }),
      });
      const body = await response.json();
      if (!response.ok)
        throw new Error(body.error?.message || 'Could not save this review.');
      setReviews((items) => items.slice(1));
      setRevealed(false);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Could not save this review.',
      );
    } finally {
      setLoading(false);
    }
  }

  if (!current)
    return (
      <div className="rounded-3xl border border-success/40 bg-success-muted p-8">
        <p className="font-mono text-xs uppercase tracking-[0.24em] text-success">
          Queue clear
        </p>
        <h2 className="mt-4 text-2xl font-semibold">
          Nothing is due right now.
        </h2>
        <p className="mt-2 text-muted">
          Continue a path or technical book and new review items will appear
          here.
        </p>
        <div className="mt-6 flex gap-4 text-sm">
          <Link href="/paths" className="text-ink">
            Explore paths →
          </Link>
          <Link href="/reading" className="text-ink">
            Open reading →
          </Link>
        </div>
      </div>
    );

  return (
    <div className="rounded-3xl border border-line bg-surface p-8">
      <div className="flex justify-between font-mono text-[10px] uppercase tracking-[0.24em] text-subtle">
        <span>
          {current.sourceType === 'reading-note'
            ? 'Reading prompt'
            : 'Due concept'}
        </span>
        <span>{reviews.length} remaining</span>
      </div>
      <h2 className="mt-8 text-3xl font-semibold">
        {current.title ?? current.conceptId.replaceAll('-', ' ')}
      </h2>
      <p className="mt-3 text-muted">
        {current.prompt ??
          'Recall the concept, explain it to yourself, then rate the effort honestly.'}
      </p>
      {current.lessonSlug && (
        <Link
          href={`/lessons/${current.lessonSlug}`}
          className="mt-5 inline-block text-sm text-ink"
        >
          Open source lesson ↗
        </Link>
      )}
      {current.answer && (
        <div className="mt-6">
          <button
            type="button"
            onClick={() => setRevealed((value) => !value)}
            className="button-secondary px-4 py-2 text-sm"
          >
            {revealed ? 'Hide answer' : 'Reveal answer'}
          </button>
          {revealed && (
            <p className="mt-4 rounded-xl border border-line bg-canvas/60 p-4 leading-7 text-ink-soft">
              {current.answer}
            </p>
          )}
        </div>
      )}
      <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {ratings.map((rating) => (
          <button
            key={rating.value}
            disabled={loading || Boolean(current.answer && !revealed)}
            onClick={() => rate(rating.value)}
            className={`rounded-xl border px-4 py-3 font-medium transition hover:bg-surface disabled:opacity-50 ${rating.tone}`}
          >
            {rating.label}
          </button>
        ))}
      </div>
      {error && (
        <p role="alert" className="mt-4 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
