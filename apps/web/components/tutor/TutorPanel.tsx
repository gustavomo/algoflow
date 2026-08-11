'use client';

import { useEffect, useState } from 'react';
import type {
  TutorHelpLevel,
  TutorOverlay,
  TutorResponse,
  TutorSceneContext,
} from '@algoflow/contracts';

const helpLevels: Array<{ value: TutorHelpLevel; label: string }> = [
  { value: 'nudge', label: 'Small nudge' },
  { value: 'guided-question', label: 'Guide me' },
  { value: 'explanation', label: 'Explain' },
];

export default function TutorPanel({
  context,
  onOverlay,
}: {
  context: TutorSceneContext;
  onOverlay: (overlay?: TutorOverlay) => void;
}) {
  const [question, setQuestion] = useState('');
  const [helpLevel, setHelpLevel] = useState<TutorHelpLevel>('nudge');
  const [result, setResult] = useState<TutorResponse>();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const contextDigest = JSON.stringify(context);

  useEffect(() => {
    setResult(undefined);
    setError('');
    onOverlay(undefined);
  }, [contextDigest, onOverlay]);

  async function ask() {
    if (!question.trim()) {
      setError('Write a question about the current scene.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, helpLevel, context }),
      });
      const payload = await response.json();
      if (!response.ok)
        throw new Error(
          payload.error?.message || 'The tutor could not respond.',
        );
      setResult(payload);
      onOverlay(payload.overlay);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'The tutor could not respond.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-2xl border border-line-strong bg-surface-raised p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="eyebrow">Context-aware tutor</p>
          <h3 className="mt-2 text-lg font-semibold">Ask the current scene</h3>
        </div>
        {result && (
          <span className="rounded-full border border-line px-3 py-1 font-mono text-[9px] uppercase tracking-[.14em] text-subtle">
            {result.provider}
            {result.cached ? ' · cached' : ''}
          </span>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {helpLevels.map((level) => (
          <button
            key={level.value}
            type="button"
            onClick={() => setHelpLevel(level.value)}
            aria-pressed={helpLevel === level.value}
            className={`min-h-10 rounded-full border px-3 py-1.5 text-xs ${
              helpLevel === level.value
                ? 'border-ink bg-ink text-canvas'
                : 'border-line text-subtle'
            }`}
          >
            {level.label}
          </button>
        ))}
      </div>

      <textarea
        value={question}
        onChange={(event) => setQuestion(event.target.value)}
        maxLength={1200}
        placeholder="What should I inspect before deciding?"
        className="field mt-4 min-h-24 w-full resize-y px-3 py-3 text-sm"
      />
      <button
        type="button"
        onClick={ask}
        disabled={loading}
        className="button-primary mt-3 min-h-11 px-4 py-2.5 text-sm disabled:opacity-50"
      >
        {loading ? 'Reading the scene…' : 'Ask tutor'}
      </button>

      {error && (
        <p role="alert" className="mt-3 text-sm text-danger">
          {error}
        </p>
      )}
      {result && (
        <div className="mt-5 border-t border-line pt-4" aria-live="polite">
          {result.overlay && (
            <div className="mb-3 flex items-start justify-between gap-3 rounded-xl border border-line bg-canvas/60 p-3">
              <p className="text-xs leading-5 text-ink-soft">
                Overlay · {result.overlay.label}
              </p>
              <button
                type="button"
                onClick={() => onOverlay(undefined)}
                className="text-[10px] uppercase tracking-wider text-subtle underline"
              >
                Hide
              </button>
            </div>
          )}
          <p className="text-sm leading-6 text-ink-soft">{result.message}</p>
          {result.followUpQuestion && (
            <p className="mt-3 border-l-2 border-ink pl-3 text-sm leading-6 text-ink">
              {result.followUpQuestion}
            </p>
          )}
          <details className="mt-4">
            <summary className="cursor-pointer text-xs text-subtle">
              Local grounding · {result.citations.length} sources
            </summary>
            <div className="mt-3 space-y-2">
              {result.citations.map((citation) => (
                <p key={citation.id} className="text-xs leading-5 text-muted">
                  <span className="font-mono text-ink">{citation.id}</span> ·{' '}
                  {citation.content}
                </p>
              ))}
            </div>
          </details>
        </div>
      )}
    </section>
  );
}
