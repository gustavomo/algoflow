'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMachine } from '@xstate/react';
import type {
  ConceptFlowNarrative,
  VisualizationKind,
} from '@algoflow/contracts';
import { createBubbleSortSteps } from '../../lib/algorithms/bubbleSort';
import {
  createSlidingWindowSteps,
  createTwoPointerSteps,
} from '../../lib/algorithms/pointerSteps';
import { createComplexitySteps } from '../../lib/algorithms/complexitySteps';
import { createGridTraversalSteps } from '../../lib/algorithms/gridTraversal';
import playbackMachine from '../../lib/xstate/playbackMachine';
import BubbleSortViz from '../animation/BubbleSortViz';
import BubbleSortChallenge from './BubbleSortChallenge';
import ConceptFlowViz from '../animation/ConceptFlowViz';
import ComplexityViz from '../animation/ComplexityViz';
import GridTraversalViz from '../animation/GridTraversalViz';
import PlaybackBar from '../animation/PlaybackBar';
import TwoPointersViz from '../animation/TwoPointersViz';

export default function LessonVizPlayer({
  slug,
  visualization: visualizationKind,
  conceptFlow,
}: {
  slug: string;
  visualization: VisualizationKind;
  conceptFlow?: ConceptFlowNarrative;
}) {
  const [state, send] = useMachine(playbackMachine);
  const [bubbleMode, setBubbleMode] = useState<'challenge' | 'review'>(
    'challenge',
  );
  const sequence = useMemo(() => {
    if (visualizationKind === 'bubble-sort')
      return createBubbleSortSteps([5, 3, 8, 4, 2]);
    if (visualizationKind === 'two-pointers') return createTwoPointerSteps();
    if (visualizationKind === 'sliding-window')
      return createSlidingWindowSteps();
    if (visualizationKind === 'complexity') return createComplexitySteps();
    if (visualizationKind === 'bfs-grid')
      return createGridTraversalSteps('bfs');
    if (visualizationKind === 'dfs-grid')
      return createGridTraversalSteps('dfs');
    if (visualizationKind === 'concept-flow' && conceptFlow)
      return conceptFlow.steps;
    return createComplexitySteps();
  }, [conceptFlow, visualizationKind]);

  useEffect(() => {
    send({ type: 'SETUP', totalSteps: sequence.length });
  }, [send, sequence.length, slug]);
  useEffect(() => {
    if (visualizationKind === 'bubble-sort' && bubbleMode === 'challenge')
      return;
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.isContentEditable ||
          ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
      )
        return;
      if (event.code === 'Space') {
        event.preventDefault();
        send({ type: state.matches('playing') ? 'PAUSE' : 'PLAY' });
      }
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        send({ type: 'PREV' });
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        send({ type: 'NEXT' });
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [bubbleMode, send, state, visualizationKind]);

  const index = Math.min(state.context.stepIndex, sequence.length - 1);
  let visualization = (
    <ComplexityViz
      snapshot={
        sequence[index] as ReturnType<typeof createComplexitySteps>[number]
      }
    />
  );
  if (visualizationKind === 'bubble-sort')
    visualization = (
      <BubbleSortViz
        snapshot={
          sequence[index] as ReturnType<typeof createBubbleSortSteps>[number]
        }
      />
    );
  if (
    visualizationKind === 'two-pointers' ||
    visualizationKind === 'sliding-window'
  ) {
    const step = sequence[index] as ReturnType<
      typeof createTwoPointerSteps
    >[number];
    visualization = <TwoPointersViz snapshot={step} mode={visualizationKind} />;
  }
  if (visualizationKind === 'bfs-grid' || visualizationKind === 'dfs-grid')
    visualization = (
      <GridTraversalViz
        snapshot={
          sequence[index] as ReturnType<typeof createGridTraversalSteps>[number]
        }
      />
    );
  if (visualizationKind === 'concept-flow' && conceptFlow) {
    visualization = (
      <ConceptFlowViz
        narrative={conceptFlow}
        step={sequence[index] as ConceptFlowNarrative['steps'][number]}
      />
    );
  }

  if (visualizationKind === 'bubble-sort')
    return (
      <div>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-y border-line py-3">
          <div>
            <p className="eyebrow">Learning mode</p>
            <p className="mt-1 text-xs text-subtle">
              Predict first, then inspect the full trace.
            </p>
          </div>
          <div className="flex border border-line p-1">
            {(['challenge', 'review'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => {
                  setBubbleMode(mode);
                  send({ type: 'RESET' });
                }}
                aria-pressed={bubbleMode === mode}
                className={`min-h-10 px-4 py-2 text-xs font-semibold capitalize ${
                  bubbleMode === mode
                    ? 'bg-ink text-canvas'
                    : 'text-subtle hover:text-ink'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
        {bubbleMode === 'challenge' ? (
          <BubbleSortChallenge />
        ) : (
          <>
            {visualization}
            <PlaybackBar state={state} send={send} />
          </>
        )}
      </div>
    );

  return (
    <div>
      {visualization}
      <PlaybackBar state={state} send={send} />
    </div>
  );
}
