"use client";
import Link from 'next/link';
import BubbleSortViz from '../../components/animation/BubbleSortViz';
import PlaybackBar from '../../components/animation/PlaybackBar';
import { useMachine } from '@xstate/react';
import playbackMachine from '../../lib/xstate/playbackMachine';

export default function LandingPage() {
  const [state, send] = useMachine(playbackMachine);
  const demoValues = [5,3,8,4,2];
  const step = { i: 0, j: 1 };

  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold mb-4">AlgoFlow</h1>
      <p className="mb-4">Interactive algorithm lessons with animations and AI explanations.</p>
      <Link href="/lessons" className="text-blue-600 underline">Browse Lessons</Link>
      <div className="mt-8">
        <BubbleSortViz values={demoValues} step={step} />
        <PlaybackBar state={state} send={send} />
      </div>
    </main>
  );
}
