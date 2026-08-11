'use client';

import { useEffect, useMemo } from 'react';
import { useMachine } from '@xstate/react';
import type {
  SystemChallengeDefinition,
  SystemChallengeEffect,
  SystemChallengeFailure,
  SystemChallengeLoadProfile,
  SystemChallengeRunResult,
  SystemChallengeStep,
  SystemDesignGraph,
} from '@algoflow/contracts';
import { createDesignChallengeMachine } from '../../lib/xstate/designChallengeMachine';
import playbackMachine from '../../lib/xstate/playbackMachine';
import PlaybackBar from '../animation/PlaybackBar';

const humanize = (value: string) => value.replaceAll('-', ' ');

export default function DesignChallengePanel({
  definition,
  graph,
  phaseId,
  onResult,
  onActiveStep,
}: {
  definition: SystemChallengeDefinition;
  graph: SystemDesignGraph;
  phaseId?: string;
  onResult: (result?: SystemChallengeRunResult) => void;
  onActiveStep: (step?: SystemChallengeStep) => void;
}) {
  const machine = useMemo(
    () => createDesignChallengeMachine(definition),
    [definition],
  );
  const [state, send] = useMachine(machine);
  const [playback, sendPlayback] = useMachine(playbackMachine);
  const result = state.context.result;
  const phaseMatches = definition.phaseId === phaseId;
  const activeStep =
    result?.steps[
      Math.min(playback.context.stepIndex, Math.max(0, result.steps.length - 1))
    ];

  useEffect(() => {
    send({ type: 'RESET' });
    sendPlayback({ type: 'RESET' });
    onResult(undefined);
    onActiveStep(undefined);
  }, [graph, phaseId, onActiveStep, onResult, send, sendPlayback]);

  useEffect(() => {
    if (result)
      sendPlayback({
        type: 'SETUP',
        totalSteps: Math.max(1, result.steps.length),
      });
  }, [result, sendPlayback]);

  useEffect(() => {
    onActiveStep(activeStep);
  }, [activeStep, onActiveStep]);

  async function run() {
    if (!state.context.prediction || !phaseMatches) return;
    send({ type: 'RUN' });
    try {
      const response = await fetch('/api/simulations/challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenarioSlug: definition.scenarioSlug,
          challengeId: definition.id,
          graph,
          phaseId,
          prediction: state.context.prediction,
          loadProfile: state.context.loadProfile,
          failure: state.context.failure,
        }),
      });
      const payload = await response.json();
      if (!response.ok)
        throw new Error(
          payload.error?.message || 'The challenge could not run.',
        );
      send({ type: 'RESOLVE', result: payload.result });
      onResult(payload.result);
    } catch (error) {
      send({
        type: 'REJECT',
        error:
          error instanceof Error
            ? error.message
            : 'The challenge could not run.',
      });
    }
  }

  function reset() {
    send({ type: 'RESET' });
    sendPlayback({ type: 'RESET' });
    onResult(undefined);
    onActiveStep(undefined);
  }

  return (
    <section className="panel overflow-hidden">
      <div className="border-b border-line bg-surface-raised p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="eyebrow">Interactive failure lab</p>
          <span className="rounded-full border border-line px-3 py-1 font-mono text-[10px] uppercase tracking-[.14em] text-subtle">
            Educational model
          </span>
        </div>
        <h2 className="mt-3 text-xl font-semibold">{definition.title}</h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          {definition.objective}
        </p>
      </div>

      <div className="p-5">
        {!phaseMatches && definition.phaseId && (
          <p className="mb-4 rounded-xl border border-warning/30 bg-warning-muted p-3 text-sm text-warning">
            Select the {humanize(definition.phaseId)} phase to run this
            challenge.
          </p>
        )}

        {!result && (
          <div className="space-y-5">
            <div>
              <p className="eyebrow">1 · Predict the dominant effect</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {definition.predictionOptions.map((prediction) => (
                  <button
                    key={prediction}
                    type="button"
                    onClick={() => send({ type: 'PREDICT', prediction })}
                    aria-pressed={state.context.prediction === prediction}
                    className={`min-h-10 rounded-full border px-3 py-2 text-xs transition ${
                      state.context.prediction === prediction
                        ? 'border-ink bg-ink text-canvas'
                        : 'border-line text-subtle hover:border-line-strong hover:text-ink'
                    }`}
                  >
                    {humanize(prediction)}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-xs text-subtle">
                2 · Load profile
                <select
                  value={state.context.loadProfile}
                  onChange={(event) =>
                    send({
                      type: 'LOAD',
                      loadProfile: event.target
                        .value as SystemChallengeLoadProfile,
                    })
                  }
                  className="field mt-2 w-full px-3 py-2.5"
                >
                  {definition.loadProfiles.map((profile) => (
                    <option key={profile} value={profile}>
                      {humanize(profile)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs text-subtle">
                3 · Injected condition
                <select
                  value={state.context.failure}
                  onChange={(event) =>
                    send({
                      type: 'FAILURE',
                      failure: event.target.value as SystemChallengeFailure,
                    })
                  }
                  className="field mt-2 w-full px-3 py-2.5"
                >
                  {definition.failures.map((failure) => (
                    <option key={failure} value={failure}>
                      {humanize(failure)}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <button
              type="button"
              onClick={run}
              disabled={
                !state.context.prediction ||
                state.matches('running') ||
                !phaseMatches
              }
              className="button-primary min-h-11 px-5 py-3 disabled:cursor-not-allowed disabled:opacity-35"
            >
              {state.matches('running')
                ? 'Running model…'
                : 'Run the condition'}
            </button>
            {state.context.error && (
              <p role="alert" className="text-sm text-danger">
                {state.context.error}
              </p>
            )}
          </div>
        )}

        {result && (
          <div className="space-y-5">
            <div
              role="status"
              className="rounded-xl border border-line-strong bg-surface-raised p-4"
            >
              <p className="eyebrow">
                {result.predictionMatches
                  ? 'Prediction confirmed'
                  : 'Prediction challenged'}
              </p>
              <p className="mt-2 text-lg font-semibold capitalize">
                {humanize(result.primaryEffect)}
              </p>
              <p className="mt-2 text-sm leading-6 text-ink-soft">
                {result.observations[0]}
              </p>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              {result.metrics.map((metric) => (
                <div
                  key={metric.name}
                  className="rounded-xl border border-line p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs capitalize text-subtle">
                      {humanize(metric.name)}
                    </span>
                    <span className="font-mono text-[10px] uppercase text-ink">
                      {metric.band} · {metric.direction}
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-muted">
                    {metric.observation}
                  </p>
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-line bg-canvas/60 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="eyebrow">Trace the consequence</p>
                <span className="text-xs text-subtle">{activeStep?.label}</span>
              </div>
              <p className="mt-3 min-h-12 text-sm leading-6 text-ink-soft">
                {activeStep?.narration}
              </p>
              <PlaybackBar state={playback} send={sendPlayback} />
            </div>

            {state.matches('reflecting') ? (
              <div className="rounded-xl border border-line-strong p-4">
                <p className="eyebrow">Reflection</p>
                <p className="mt-2 text-sm leading-6 text-ink-soft">
                  {result.reflectionPrompt}
                </p>
                <button
                  type="button"
                  onClick={() => send({ type: 'INSPECT' })}
                  className="button-secondary mt-3 px-3 py-2 text-xs"
                >
                  Inspect the trace
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => send({ type: 'REFLECT' })}
                className="button-secondary px-4 py-2 text-sm"
              >
                Reflect on the outcome
              </button>
            )}
            <button
              type="button"
              onClick={reset}
              className="text-xs text-subtle underline"
            >
              Reset challenge
            </button>
          </div>
        )}

        <details className="mt-5 border-t border-line pt-4">
          <summary className="cursor-pointer text-xs text-subtle">
            Model constraints
          </summary>
          <ul className="mt-3 space-y-2 text-xs leading-5 text-muted">
            {definition.constraints.map((constraint) => (
              <li key={constraint}>— {constraint}</li>
            ))}
          </ul>
        </details>
      </div>
    </section>
  );
}
