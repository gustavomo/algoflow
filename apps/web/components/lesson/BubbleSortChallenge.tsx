'use client';

import { useCallback, useMemo, useState } from 'react';
import { useMachine } from '@xstate/react';
import {
  createBubbleSortChallenge,
  type BubbleSortSnapshot,
} from '@algoflow/learning-engine';
import type { TutorOverlay } from '@algoflow/contracts';
import { createBubbleChallengeMachine } from '../../lib/xstate/bubbleChallengeMachine';
import BubbleSortViz from '../animation/BubbleSortViz';
import TutorPanel from '../tutor/TutorPanel';

const challengeDefinition = {
  id: 'bubble-sort-core',
  version: 1 as const,
  title: 'Bubble Sort decisions',
  objective: 'Predict each adjacent comparison and decide whether it swaps.',
  values: [5, 3, 8, 4, 2],
};

function selectedIndices(
  snapshot: BubbleSortSnapshot,
  selectedItemIds: string[],
) {
  if (selectedItemIds.length !== 2) return null;
  const indices = selectedItemIds
    .map((itemId) => snapshot.items.findIndex((item) => item.id === itemId))
    .sort((left, right) => left - right);
  return indices.every((index) => index >= 0)
    ? ([indices[0], indices[1]] as [number, number])
    : null;
}

export default function BubbleSortChallenge() {
  const challenge = useMemo(
    () => createBubbleSortChallenge(challengeDefinition),
    [],
  );
  const machine = useMemo(
    () => createBubbleChallengeMachine(challenge),
    [challenge],
  );
  const [state, send] = useMachine(machine);
  const [tutorOverlay, setTutorOverlay] = useState<TutorOverlay>();
  const complete = state.matches('complete');
  const decision = challenge.decisions[state.context.decisionIndex];
  const correctFeedback =
    state.matches('feedback') && state.context.predictionCorrect === true;
  const baseSnapshot = complete
    ? challenge.completeSnapshot
    : correctFeedback
      ? decision.resultSnapshot
      : decision.compareSnapshot;
  const snapshot: BubbleSortSnapshot = complete
    ? baseSnapshot
    : {
        ...baseSnapshot,
        compared: correctFeedback
          ? baseSnapshot.compared
          : selectedIndices(baseSnapshot, state.context.selectedItemIds),
        narration: state.matches('feedback')
          ? state.context.feedback
          : 'Choose the next adjacent pair, predict swap or keep, then run the decision.',
      };
  const ready =
    state.context.selectedItemIds.length === 2 &&
    state.context.predictedSwap !== null;
  const activeCodeLine = complete
    ? 4
    : correctFeedback && decision.shouldSwap
      ? 2
      : state.matches('feedback')
        ? 3
        : 1;
  const tutorContext = {
    kind: 'bubble-sort' as const,
    lessonSlug: 'bubble-sort-js',
    phase: complete
      ? ('complete' as const)
      : state.matches('feedback')
        ? ('feedback' as const)
        : ('predict' as const),
    items: snapshot.items,
    selectedItemIds: state.context.selectedItemIds,
    predictedSwap: state.context.predictedSwap ?? undefined,
    predictionCorrect: state.context.predictionCorrect ?? undefined,
    narration: snapshot.narration,
  };
  const updateTutorOverlay = useCallback(
    (overlay?: TutorOverlay) => setTutorOverlay(overlay),
    [],
  );
  const tutorItemIds =
    tutorOverlay?.kind === 'highlight-items' ? tutorOverlay.itemIds : [];

  return (
    <div className="space-y-5">
      <BubbleSortViz
        snapshot={snapshot}
        mode="challenge"
        selectedItemIds={state.context.selectedItemIds}
        tutorItemIds={tutorItemIds}
        tutorLabel={
          tutorOverlay?.kind === 'highlight-items'
            ? tutorOverlay.label
            : undefined
        }
        onSelectItem={(itemId) => send({ type: 'SELECT_ITEM', itemId })}
        onSwapIntent={(itemIds) => send({ type: 'SELECT_PAIR', itemIds })}
      />

      <section className="grid gap-4 rounded-2xl border border-line bg-canvas/60 p-4 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div>
          <div className="flex items-center justify-between gap-3">
            <p className="eyebrow">Predict → manipulate → run</p>
            <span className="font-mono text-[10px] text-subtle">
              {complete
                ? `${challenge.decisions.length} / ${challenge.decisions.length}`
                : `${state.context.decisionIndex + 1} / ${challenge.decisions.length}`}
            </span>
          </div>
          <div
            className="mt-3 h-1 overflow-hidden rounded-full bg-surface-raised"
            role="progressbar"
            aria-label="Bubble Sort challenge progress"
            aria-valuemin={0}
            aria-valuemax={challenge.decisions.length}
            aria-valuenow={
              complete
                ? challenge.decisions.length
                : state.context.decisionIndex
            }
          >
            <div
              className="h-full bg-action transition-[width]"
              style={{
                width: `${((complete ? challenge.decisions.length : state.context.decisionIndex) / challenge.decisions.length) * 100}%`,
              }}
            />
          </div>

          {!complete && !state.matches('feedback') && (
            <>
              <p className="mt-4 text-sm leading-6 text-ink-soft">
                Select two adjacent bars. You can click them, use Enter while a
                bar is focused, or drag one across its neighbor.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={() => send({ type: 'PREDICT_SWAP', value: true })}
                  aria-pressed={state.context.predictedSwap === true}
                  className={`button-secondary min-h-11 px-4 py-2 text-sm ${
                    state.context.predictedSwap === true
                      ? 'border-ink bg-ink text-canvas'
                      : ''
                  }`}
                >
                  Swap the pair
                </button>
                <button
                  onClick={() => send({ type: 'PREDICT_SWAP', value: false })}
                  aria-pressed={state.context.predictedSwap === false}
                  className={`button-secondary min-h-11 px-4 py-2 text-sm ${
                    state.context.predictedSwap === false
                      ? 'border-ink bg-ink text-canvas'
                      : ''
                  }`}
                >
                  Keep the order
                </button>
                <button
                  onClick={() => send({ type: 'RUN' })}
                  disabled={!ready}
                  className="button-primary min-h-11 px-5 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-35"
                >
                  Run decision
                </button>
              </div>
            </>
          )}

          {state.matches('feedback') && (
            <div
              className="mt-4 rounded-xl border border-line-strong bg-surface-raised p-4"
              role={state.context.predictionCorrect ? 'status' : 'alert'}
              aria-live="polite"
            >
              <p className="eyebrow">
                {state.context.predictionCorrect
                  ? 'Prediction confirmed'
                  : 'Inspect the rule'}
              </p>
              <p className="mt-2 text-sm leading-6 text-ink-soft">
                {state.context.feedback}
              </p>
              <button
                onClick={() =>
                  send({
                    type: state.context.predictionCorrect
                      ? 'CONTINUE'
                      : 'RETRY',
                  })
                }
                className="button-primary mt-4 min-h-11 px-4 py-2 text-sm"
              >
                {state.context.predictionCorrect
                  ? state.context.decisionIndex >=
                    challenge.decisions.length - 1
                    ? 'See completion'
                    : 'Next decision'
                  : 'Try again'}
              </button>
            </div>
          )}

          {complete && (
            <div className="mt-4" role="status" aria-live="polite">
              <p className="text-lg font-semibold">Challenge complete</p>
              <p className="mt-2 text-sm leading-6 text-ink-soft">
                {challenge.completeSnapshot.narration}
              </p>
              <button
                onClick={() => send({ type: 'RESET' })}
                className="button-secondary mt-4 min-h-11 px-4 py-2 text-sm"
              >
                Reset challenge
              </button>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-line bg-surface-raised p-4">
          <p className="eyebrow">Synchronized pseudocode</p>
          <ol className="mt-3 space-y-2 font-mono text-[11px] leading-5">
            {[
              'repeat passes over unsorted values',
              'compare adjacent left and right',
              'swap when left > right',
              'advance or settle the boundary',
              'stop when the sequence is sorted',
            ].map((line, index) => (
              <li
                key={line}
                className={`rounded px-2 py-1 ${
                  activeCodeLine === index
                    ? 'bg-ink text-canvas'
                    : 'text-subtle'
                }`}
              >
                {index + 1}. {line}
              </li>
            ))}
          </ol>
        </div>
      </section>
      <TutorPanel context={tutorContext} onOverlay={updateTutorOverlay} />
    </div>
  );
}
