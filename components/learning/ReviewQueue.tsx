'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { ReviewRating, ReviewState } from '../../lib/learning/types';

const ratings: { value: ReviewRating; label: string; tone: string }[] = [
  { value: 'again', label: 'Again', tone: 'border-rose-300/30 text-rose-300' },
  { value: 'hard', label: 'Hard', tone: 'border-amber-300/30 text-amber-300' },
  { value: 'good', label: 'Good', tone: 'border-cyan-300/30 text-cyan-300' },
  {
    value: 'easy',
    label: 'Easy',
    tone: 'border-emerald-300/30 text-emerald-300',
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
      <div className="rounded-3xl border border-emerald-300/20 bg-emerald-300/[0.05] p-8">
        <p className="font-mono text-xs uppercase tracking-[0.24em] text-emerald-300">
          Queue clear
        </p>
        <h2 className="mt-4 text-2xl font-semibold">
          Nothing is due right now.
        </h2>
        <p className="mt-2 text-slate-400">
          Continue a path and new review items will appear here.
        </p>
        <Link href="/paths" className="mt-6 inline-block text-cyan-300">
          Explore paths →
        </Link>
      </div>
    );

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-8">
      <div className="flex justify-between font-mono text-[10px] uppercase tracking-[0.24em] text-slate-500">
        <span>Due concept</span>
        <span>{reviews.length} remaining</span>
      </div>
      <h2 className="mt-8 text-4xl font-semibold capitalize">
        {current.conceptId.replaceAll('-', ' ')}
      </h2>
      <p className="mt-3 text-slate-400">
        Recall the concept, explain it to yourself, then rate the effort
        honestly.
      </p>
      <Link
        href={`/lessons/${current.lessonSlug}`}
        className="mt-5 inline-block text-sm text-cyan-300"
      >
        Open source lesson ↗
      </Link>
      <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {ratings.map((rating) => (
          <button
            key={rating.value}
            disabled={loading}
            onClick={() => rate(rating.value)}
            className={`rounded-xl border px-4 py-3 font-medium transition hover:bg-white/[0.05] disabled:opacity-50 ${rating.tone}`}
          >
            {rating.label}
          </button>
        ))}
      </div>
      {error && (
        <p role="alert" className="mt-4 text-sm text-rose-300">
          {error}
        </p>
      )}
    </div>
  );
}
