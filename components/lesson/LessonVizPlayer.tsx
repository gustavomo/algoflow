'use client';
import { useEffect, useMemo, useState } from 'react';
import { useMachine } from '@xstate/react';
import playbackMachine from '../../lib/xstate/playbackMachine';
import PlaybackBar from '../animation/PlaybackBar';
import BubbleSortViz from '../animation/BubbleSortViz';
import TwoPointersViz from '../animation/TwoPointersViz';

type LessonSlug = 'bubble-sort-js' | 'sliding-window-ts' | string;

export default function LessonVizPlayer({ slug }: { slug: LessonSlug }) {
  const [state, send] = useMachine(playbackMachine);
  const [stepIndex, setStepIndex] = useState(0);

  // Precompute step sequences per lesson type
  const { totalSteps, render } = useMemo(() => {
    if (slug === 'bubble-sort-js') {
      const values = [5, 3, 8, 4, 2];
      const n = values.length;
      const steps: { i: number; j: number }[] = [];
      for (let pass = 0; pass < n - 1; pass++) {
        for (let j = 0; j < n - 1 - pass; j++) {
          steps.push({ i: j, j: j + 1 });
        }
      }
      const render = (idx: number) => {
        const s = steps[Math.min(idx, steps.length - 1)] ?? { i: 0, j: 1 };
        return <BubbleSortViz values={values} step={s} />;
      };
      return { totalSteps: steps.length, render };
    }
    if (slug === 'sliding-window-ts') {
      const length = 5;
      const steps: { left: number; right: number }[] = [
        { left: 0, right: 1 },
        { left: 0, right: 2 },
        { left: 1, right: 3 },
        { left: 2, right: 4 },
      ];
      const render = (idx: number) => {
        const s = steps[Math.min(idx, steps.length - 1)] ?? { left: 0, right: 1 };
        return <TwoPointersViz length={length} left={s.left} right={s.right} />;
      };
      return { totalSteps: steps.length, render };
    }
    // Fallback placeholder
    const render = () => <div className="border h-40 flex items-center justify-center">PixiJS Placeholder</div>;
    return { totalSteps: 1, render };
  }, [slug]);

  // Reset when lesson changes
  useEffect(() => {
    setStepIndex(0);
  }, [slug]);

  // Auto-advance when playing
  useEffect(() => {
    if (!state.matches('playing')) return;
    const id = setInterval(() => {
      setStepIndex((i) => Math.min(i + 1, totalSteps - 1));
    }, 700);
    return () => clearInterval(id);
  }, [state, totalSteps]);

  const handleSend = (event: any) => {
    // Intercept manual navigation
    const type = typeof event === 'string' ? event : event?.type;
    if (type === 'NEXT') setStepIndex((i) => Math.min(i + 1, totalSteps - 1));
    if (type === 'PREV') setStepIndex((i) => Math.max(i - 1, 0));
    if (type === 'PLAY' || type === 'PAUSE') {
      send(event as any);
    }
  };

  return (
    <div>
      {render(stepIndex)}
      <PlaybackBar state={state} send={handleSend as any} />
    </div>
  );
}
