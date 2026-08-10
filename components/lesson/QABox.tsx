'use client';

import { useState } from 'react';
import type { Chunk } from '../../lib/rag/types';

interface AskResponse {
  answer: string;
  citations: Chunk[];
  provider: 'mock' | 'openai';
  cached: boolean;
}

export default function QABox({
  tech,
  lessonSlug,
}: {
  tech?: string;
  lessonSlug?: string;
}) {
  const [question, setQuestion] = useState('');
  const [result, setResult] = useState<AskResponse | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function ask() {
    if (!question.trim()) {
      setError('Write a question before asking.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, tech, lessonSlug }),
      });
      const body = await response.json();
      if (!response.ok)
        throw new Error(
          body.error?.message || 'Could not generate an explanation.',
        );
      setResult(body);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Could not generate an explanation.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mt-10 rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.04] p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-cyan-300">
            Explain with AI
          </p>
          <h2 className="mt-2 text-xl font-semibold">
            Ask the lesson, not the internet
          </h2>
        </div>
        {result && (
          <span className="rounded-full border border-white/10 px-3 py-1 font-mono text-[9px] uppercase tracking-[0.16em] text-slate-500">
            {result.provider}
            {result.cached ? ' · cached' : ''}
          </span>
        )}
      </div>
      <textarea
        value={question}
        onChange={(event) => setQuestion(event.target.value)}
        className="mt-5 min-h-28 w-full resize-y rounded-xl border border-white/10 bg-black/20 p-4 outline-none transition focus:border-cyan-300/50"
        placeholder="Why does Bubble Sort stop comparing the sorted boundary?"
      />
      <div className="mt-3 flex items-center gap-3">
        <button
          onClick={ask}
          disabled={loading}
          className="rounded-xl bg-cyan-300 px-5 py-2.5 font-semibold text-slate-950 hover:bg-cyan-200 disabled:opacity-60"
        >
          {loading
            ? 'Grounding answer…'
            : error
              ? 'Retry explanation'
              : 'Explain step by step'}
        </button>
        <span className="text-xs text-slate-600">
          Local citations · mockable
        </span>
      </div>
      {error && (
        <p
          role="alert"
          className="mt-4 rounded-xl border border-rose-300/20 bg-rose-300/[0.05] p-3 text-sm text-rose-200"
        >
          {error}
        </p>
      )}
      {result && (
        <div className="mt-6 border-t border-white/[0.08] pt-6">
          <div className="space-y-3 text-sm leading-7 text-slate-300">
            {result.answer
              .split('\n')
              .filter(Boolean)
              .map((paragraph, index) => (
                <p key={`${index}-${paragraph.slice(0, 12)}`}>{paragraph}</p>
              ))}
          </div>
          <div className="mt-6">
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-slate-600">
              Local sources
            </p>
            <div className="mt-3 space-y-2">
              {result.citations.length ? (
                result.citations.map((citation) => (
                  <div
                    key={citation.id}
                    className="rounded-lg border border-white/[0.07] bg-black/15 p-3"
                  >
                    <p className="font-mono text-[10px] text-cyan-300">
                      {citation.id}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      {citation.content}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500">
                  No local chunk matched this question.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
