'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { LessonDefinition } from '@algoflow/contracts';

export default function LessonActions({
  lesson,
}: {
  lesson: LessonDefinition;
}) {
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  async function complete() {
    setLoading(true);
    setStatus('');
    try {
      const response = await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonSlug: lesson.slug,
          status: 'completed',
          percent: 100,
        }),
      });
      const body = await response.json();
      if (!response.ok)
        throw new Error(body.error?.message || 'Could not save progress.');
      setStatus('Lesson completion saved on the server.');
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : 'Could not save progress.',
      );
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className="mt-10 rounded-2xl border border-line bg-surface p-5">
      <p className="font-medium">Ready to prove it?</p>
      <p className="mt-2 text-sm text-subtle">
        Save the lesson, then complete its deterministic checkpoint.
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        <button
          disabled={loading}
          onClick={complete}
          className="rounded-xl border border-line-strong px-4 py-2 text-sm hover:bg-surface disabled:opacity-60"
        >
          {loading ? 'Saving…' : 'Mark lesson complete'}
        </button>
        <Link
          href={`/assessments/${lesson.assessmentSlug}`}
          className="rounded-xl bg-action px-4 py-2 text-sm font-semibold text-canvas"
        >
          Open checkpoint
        </Link>
      </div>
      {status && (
        <p role="status" className="mt-3 text-xs text-muted">
          {status}
        </p>
      )}
    </div>
  );
}
