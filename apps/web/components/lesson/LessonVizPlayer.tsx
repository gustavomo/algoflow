'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMachine } from '@xstate/react';
import type {
  ConceptFlowNarrative,
  RuntimeScene,
  VisualizationKind,
} from '@algoflow/contracts';
import { createComplexitySteps } from '../../lib/algorithms/complexitySteps';
import playbackMachine from '../../lib/xstate/playbackMachine';
import BubbleSortChallenge from './BubbleSortChallenge';
import ConceptFlowViz from '../animation/ConceptFlowViz';
import ComplexityViz from '../animation/ComplexityViz';
import PlaybackBar from '../animation/PlaybackBar';
import PredictChallenge from './PredictChallenge';
import RuntimeSceneViz from '../animation/RuntimeSceneViz';

const RUNTIME_SCENE_SPEED_MS = 1200;

type LessonMode = 'scene' | 'challenge' | 'lab';

const MODE_HINT: Record<LessonMode, string> = {
  scene: 'Watch the narrated walkthrough at your own pace.',
  challenge: 'Predict each next step before it is revealed.',
  lab: 'Pick the pair yourself and ask the tutor for help.',
};

export default function LessonVizPlayer({
  slug,
  visualization: visualizationKind,
  conceptFlow,
  runtimeScene,
}: {
  slug: string;
  visualization: VisualizationKind;
  conceptFlow?: ConceptFlowNarrative;
  runtimeScene?: RuntimeScene;
}) {
  // Narrated runtime steps need reading time, so they start at the 0.5×
  // preset. Seeding the machine context (not sending SPEED from an effect)
  // keeps the server-rendered selector and the hydrated one in agreement.
  // A lesson that ships a scene plays it whatever its kind: `bubble-sort`
  // keeps its own kind only to add the hands-on lab as a third mode.
  const isScene =
    visualizationKind === 'runtime-scene' || Boolean(runtimeScene);
  const [state, send] = useMachine(() =>
    isScene
      ? playbackMachine.withContext({
          ...playbackMachine.context,
          speedMs: RUNTIME_SCENE_SPEED_MS,
        })
      : playbackMachine,
  );
  const [mode, setMode] = useState<LessonMode>('scene');
  const modes = useMemo<LessonMode[]>(
    () => [
      'scene',
      ...(runtimeScene?.steps.some((step) => step.challenge)
        ? (['challenge'] as const)
        : []),
      ...(visualizationKind === 'bubble-sort' ? (['lab'] as const) : []),
    ],
    [runtimeScene, visualizationKind],
  );
  const sequence = useMemo(() => {
    if (isScene && runtimeScene) return runtimeScene.steps;
    if (visualizationKind === 'concept-flow' && conceptFlow)
      return conceptFlow.steps;
    return createComplexitySteps();
  }, [conceptFlow, isScene, runtimeScene, visualizationKind]);

  useEffect(() => {
    send({ type: 'SETUP', totalSteps: sequence.length });
  }, [send, sequence.length, slug]);
  useEffect(() => {
    // The challenge and the lab drive themselves; only the scene has playback.
    if (mode !== 'scene') return;
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
  }, [mode, send, state]);

  const index = Math.min(state.context.stepIndex, sequence.length - 1);
  let visualization = (
    <ComplexityViz
      snapshot={
        sequence[index] as ReturnType<typeof createComplexitySteps>[number]
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

  if (isScene)
    visualization = runtimeScene ? (
      <RuntimeSceneViz
        scene={runtimeScene}
        step={sequence[index] as RuntimeScene['steps'][number]}
        stepIndex={index}
      />
    ) : (
      <p className="border-y border-line py-10 text-center text-sm text-subtle">
        This lesson&apos;s runtime scene is unavailable.
      </p>
    );

  const playback = isScene ? (
    // Scenes are taller than a phone screen and scroll inside the sticky
    // desktop player: dock the controls so they stay in reach. On phones
    // the dock sits just above AppShell's fixed mobile navigation.
    <div className="sticky bottom-[calc(2.5rem+max(.45rem,env(safe-area-inset-bottom)))] z-10 -mx-4 border-t border-line bg-canvas px-4 pb-2 sm:bottom-0 sm:mx-0 sm:border-t-0 sm:px-0 sm:pb-1">
      <PlaybackBar state={state} send={send} docked />
    </div>
  ) : (
    <PlaybackBar state={state} send={send} />
  );

  return (
    <div>
      {modes.length > 1 && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-y border-line py-2 sm:mb-4 sm:py-3">
          <div className="min-w-0">
            <p className="eyebrow">Learning mode</p>
            <p className="mt-1 text-xs text-subtle">{MODE_HINT[mode]}</p>
          </div>
          <div className="flex border border-line p-1" data-lesson-modes>
            {modes.map((item) => (
              <button
                key={item}
                onClick={() => {
                  setMode(item);
                  send({ type: 'RESET' });
                }}
                aria-pressed={mode === item}
                className={`min-h-11 px-3 py-2 text-xs font-semibold capitalize sm:px-4 ${
                  mode === item
                    ? 'bg-ink text-canvas'
                    : 'text-subtle hover:text-ink'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      )}
      {mode === 'lab' ? (
        <BubbleSortChallenge />
      ) : mode === 'challenge' && runtimeScene ? (
        <PredictChallenge
          scene={runtimeScene}
          onWatchScene={() => setMode('scene')}
        />
      ) : (
        <>
          {visualization}
          {playback}
        </>
      )}
    </div>
  );
}
