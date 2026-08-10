'use client';

import { useEffect, useMemo } from 'react';
import { useMachine } from '@xstate/react';
import { createBubbleSortSteps } from '../../lib/algorithms/bubbleSort';
import {
  createSlidingWindowSteps,
  createTwoPointerSteps,
} from '../../lib/algorithms/pointerSteps';
import { lessonBySlug } from '../../lib/content/catalog';
import playbackMachine from '../../lib/xstate/playbackMachine';
import BubbleSortViz from '../animation/BubbleSortViz';
import ComplexityViz from '../animation/ComplexityViz';
import PixiCanvas from '../animation/PixiCanvas';
import PlaybackBar from '../animation/PlaybackBar';
import TwoPointersViz from '../animation/TwoPointersViz';

export default function LessonVizPlayer({ slug }: { slug: string }) {
  const lesson = lessonBySlug.get(slug);
  const [state, send] = useMachine(playbackMachine);
  const sequence = useMemo(() => {
    if (lesson?.visualization === 'bubble-sort')
      return createBubbleSortSteps([5, 3, 8, 4, 2]);
    if (lesson?.visualization === 'two-pointers')
      return createTwoPointerSteps();
    if (lesson?.visualization === 'sliding-window')
      return createSlidingWindowSteps();
    if (lesson?.visualization === 'complexity') return [0, 1, 2];
    return Array.from({ length: 11 }, (_, index) => index);
  }, [lesson?.visualization]);

  useEffect(() => {
    send({ type: 'SETUP', totalSteps: sequence.length });
  }, [send, sequence.length, slug]);
  useEffect(() => {
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
  }, [send, state]);

  const index = Math.min(state.context.stepIndex, sequence.length - 1);
  let visualization = <ComplexityViz step={index} />;
  if (lesson?.visualization === 'bubble-sort')
    visualization = (
      <BubbleSortViz
        snapshot={
          sequence[index] as ReturnType<typeof createBubbleSortSteps>[number]
        }
      />
    );
  if (
    lesson?.visualization === 'two-pointers' ||
    lesson?.visualization === 'sliding-window'
  ) {
    const step = sequence[index] as ReturnType<
      typeof createTwoPointerSteps
    >[number];
    visualization = (
      <>
        <TwoPointersViz length={7} left={step.left} right={step.right} />
        <p className="mt-4 min-h-6 text-sm text-slate-400">{step.narration}</p>
      </>
    );
  }
  if (
    lesson?.visualization === 'bfs-grid' ||
    lesson?.visualization === 'dfs-grid'
  )
    visualization = (
      <PixiCanvas
        mode={lesson.visualization === 'bfs-grid' ? 'bfs' : 'dfs'}
        step={index}
      />
    );

  return (
    <div>
      {visualization}
      <PlaybackBar state={state} send={send} />
    </div>
  );
}
