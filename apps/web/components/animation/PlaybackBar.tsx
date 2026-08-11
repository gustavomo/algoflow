'use client';
import type { StateFrom } from 'xstate';
import playbackMachine from '../../lib/xstate/playbackMachine';
import type { PlaybackEvent } from '../../lib/xstate/playbackMachine';

interface Props {
  state: StateFrom<typeof playbackMachine>;
  send: (event: PlaybackEvent) => void;
}

export default function PlaybackBar({ state, send }: Props) {
  const { stepIndex, totalSteps, speedMs } = state.context;
  return (
    <div className="mt-5 rounded-2xl border border-line bg-canvas/60 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <button
          aria-label="Previous step"
          onClick={() => send({ type: 'PREV' })}
          disabled={stepIndex === 0}
          className="rounded-lg border border-line px-3 py-2 text-sm disabled:opacity-30"
        >
          ←
        </button>
        <button
          aria-label={state.matches('playing') ? 'Pause' : 'Play'}
          onClick={() =>
            send({ type: state.matches('playing') ? 'PAUSE' : 'PLAY' })
          }
          className="min-w-24 rounded-lg bg-action px-4 py-2 text-sm font-semibold text-canvas"
        >
          {state.matches('playing')
            ? 'Pause'
            : state.matches('completed')
              ? 'Replay'
              : 'Play'}
        </button>
        <button
          aria-label="Next step"
          onClick={() => send({ type: 'NEXT' })}
          disabled={stepIndex >= totalSteps - 1}
          className="rounded-lg border border-line px-3 py-2 text-sm disabled:opacity-30"
        >
          →
        </button>
        <label className="ml-auto flex items-center gap-2 text-xs text-subtle">
          Speed
          <select
            aria-label="Playback speed"
            value={speedMs}
            onChange={(event) =>
              send({ type: 'SPEED', speedMs: Number(event.target.value) })
            }
            className="rounded-lg border border-line bg-surface px-2 py-2 text-ink-soft"
          >
            <option value={1200}>0.5×</option>
            <option value={700}>1×</option>
            <option value={400}>1.5×</option>
            <option value={220}>2×</option>
          </select>
        </label>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <input
          aria-label="Seek animation step"
          type="range"
          min={0}
          max={Math.max(0, totalSteps - 1)}
          value={stepIndex}
          onChange={(event) =>
            send({ type: 'SEEK', index: Number(event.target.value) })
          }
          className="h-1 flex-1 accent-action"
        />
        <span className="min-w-16 text-right font-mono text-[10px] text-subtle">
          {stepIndex + 1} / {totalSteps}
        </span>
      </div>
      <p className="mt-3 text-[11px] text-faint">Space play/pause · ←/→ step</p>
    </div>
  );
}
