'use client';

import { useState } from 'react';
import type {
  LearningScenarioDraft,
  ScenarioDraftDifficulty,
  ScenarioEvalReport,
} from '@algoflow/contracts';

interface AuthoringResult {
  draft: LearningScenarioDraft;
  report: ScenarioEvalReport;
  provider?: 'mock' | 'openai';
}

function DraftPreview({ draft }: { draft: LearningScenarioDraft }) {
  if (draft.kind === 'bubble-sort') {
    const max = Math.max(...draft.values, 1);
    return (
      <div className="rounded-2xl border border-line bg-canvas/60 p-5">
        <p className="eyebrow">Visual preview</p>
        <div className="mt-5 flex h-44 items-end justify-center gap-3 border-b border-line px-3">
          {draft.values.map((value, index) => (
            <div
              key={`${index}-${value}`}
              className="flex w-12 flex-col items-center gap-2"
            >
              <div
                className="w-full rounded-t-lg border border-line-strong bg-ink"
                style={{ height: `${32 + (value / max) * 100}px` }}
              />
              <span className="font-mono text-[10px] text-subtle">{value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className="rounded-2xl border border-line bg-canvas/60 p-5">
      <p className="eyebrow">Challenge preview</p>
      <h3 className="mt-3 text-lg font-semibold">{draft.title}</h3>
      <p className="mt-2 text-sm text-muted">{draft.objective}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {draft.predictionOptions.map((option) => (
          <span
            key={option}
            className="rounded-full border border-line px-3 py-2 text-xs text-subtle"
          >
            {option.replaceAll('-', ' ')}
          </span>
        ))}
      </div>
      <p className="mt-4 font-mono text-[10px] uppercase tracking-wider text-faint">
        {draft.scenarioSlug} · {draft.loadProfile} · {draft.failure}
      </p>
    </div>
  );
}

export default function ScenarioAuthoringWorkbench() {
  const [kind, setKind] =
    useState<LearningScenarioDraft['kind']>('bubble-sort');
  const [difficulty, setDifficulty] =
    useState<ScenarioDraftDifficulty>('intermediate');
  const [objective, setObjective] = useState(
    'Practice one decision at a time and explain the invariant.',
  );
  const [source, setSource] = useState('');
  const [result, setResult] = useState<AuthoringResult>();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function request(path: string, body: unknown) {
    const response = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const payload = await response.json();
    if (!response.ok)
      throw new Error(
        payload.error?.message || 'The authoring request failed.',
      );
    return payload as AuthoringResult;
  }

  async function generate() {
    setLoading(true);
    setError('');
    try {
      const generated = await request('/api/authoring/scenarios/generate', {
        kind,
        difficulty,
        objective,
      });
      setResult(generated);
      setSource(JSON.stringify(generated.draft, null, 2));
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Generation failed.',
      );
    } finally {
      setLoading(false);
    }
  }

  async function validate() {
    setLoading(true);
    setError('');
    try {
      const draft = JSON.parse(source) as unknown;
      const validated = await request('/api/authoring/scenarios/validate', {
        draft,
      });
      setResult(validated);
    } catch (requestError) {
      setResult(undefined);
      setError(
        requestError instanceof SyntaxError
          ? 'The draft is not valid JSON.'
          : requestError instanceof Error
            ? requestError.message
            : 'Validation failed.',
      );
    } finally {
      setLoading(false);
    }
  }

  function exportDraft() {
    if (!result?.report.passed) return;
    const blob = new Blob([JSON.stringify(result.draft, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${result.draft.id}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
      <div className="space-y-5">
        <section className="panel p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-xs text-subtle">
              Scenario kind
              <select
                value={kind}
                onChange={(event) =>
                  setKind(event.target.value as LearningScenarioDraft['kind'])
                }
                className="field mt-2 w-full px-3 py-2.5"
              >
                <option value="bubble-sort">Bubble Sort</option>
                <option value="design-lab">Design Lab</option>
              </select>
            </label>
            <label className="text-xs text-subtle">
              Difficulty
              <select
                value={difficulty}
                onChange={(event) =>
                  setDifficulty(event.target.value as ScenarioDraftDifficulty)
                }
                className="field mt-2 w-full px-3 py-2.5"
              >
                <option value="foundation">Foundation</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </label>
          </div>
          <label className="mt-4 block text-xs text-subtle">
            Learning objective
            <textarea
              value={objective}
              onChange={(event) => setObjective(event.target.value)}
              maxLength={240}
              className="field mt-2 min-h-20 w-full resize-y px-3 py-3 text-sm"
            />
          </label>
          <button
            type="button"
            onClick={generate}
            disabled={loading}
            className="button-primary mt-4 px-5 py-3 disabled:opacity-50"
          >
            {loading ? 'Working…' : 'Generate draft'}
          </button>
        </section>

        <section className="panel p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="eyebrow">Typed draft</p>
              <p className="mt-2 text-sm text-muted">
                Edit JSON, then run the deterministic suite again.
              </p>
            </div>
            <button
              type="button"
              onClick={validate}
              disabled={loading || !source.trim()}
              className="button-secondary px-4 py-2 text-sm disabled:opacity-40"
            >
              Validate draft
            </button>
          </div>
          <textarea
            value={source}
            onChange={(event) => setSource(event.target.value)}
            spellCheck={false}
            className="field mt-4 min-h-[460px] w-full resize-y p-4 font-mono text-xs leading-6"
            placeholder="Generate a draft or paste strict scenario JSON."
          />
        </section>
        {result && <DraftPreview draft={result.draft} />}
      </div>

      <aside className="space-y-5 xl:sticky xl:top-28 xl:self-start">
        <section className="panel p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="eyebrow">Deterministic evals</p>
            {result?.provider && (
              <span className="text-xs text-subtle">{result.provider}</span>
            )}
          </div>
          {!result ? (
            <p className="mt-4 text-sm leading-6 text-muted">
              Generate or validate a draft to inspect schema, solvability,
              state, and visual checks.
            </p>
          ) : (
            <>
              <div className="mt-4 flex items-end justify-between gap-3">
                <p className="text-2xl font-semibold">
                  {result.report.passed ? 'Evals passed' : 'Blocked'}
                </p>
                <span
                  className={
                    result.report.passed ? 'text-success' : 'text-danger'
                  }
                >
                  {
                    result.report.checks.filter(
                      (check) => check.status === 'pass',
                    ).length
                  }
                  /{result.report.checks.length}
                </span>
              </div>
              <div className="mt-4 space-y-2">
                {result.report.checks.map((check) => (
                  <div
                    key={check.id}
                    className="rounded-xl border border-line p-3"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={
                          check.status === 'pass'
                            ? 'text-success'
                            : 'text-danger'
                        }
                      >
                        {check.status === 'pass' ? '✓' : '×'}
                      </span>
                      <p className="text-xs font-medium capitalize">
                        {check.category.replaceAll('-', ' ')}
                      </p>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-subtle">
                      {check.evidence}
                    </p>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={exportDraft}
                disabled={!result.report.passed}
                className="button-primary mt-5 w-full px-4 py-2.5 text-sm disabled:opacity-35"
              >
                Export passing JSON
              </button>
              <p className="mt-3 text-xs leading-5 text-muted">
                Human review remains required. Export does not publish or
                persist this scenario.
              </p>
            </>
          )}
        </section>
        {error && (
          <p
            role="alert"
            className="rounded-xl border border-danger/40 bg-danger-muted p-4 text-sm text-danger"
          >
            {error}
          </p>
        )}
      </aside>
    </div>
  );
}
