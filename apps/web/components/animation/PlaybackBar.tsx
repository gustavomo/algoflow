'use client';
import type { StateFrom } from 'xstate';
import playbackMachine from '../../lib/xstate/playbackMachine';
import type { PlaybackEvent } from '../../lib/xstate/playbackMachine';

interface Props {
  state: StateFrom<typeof playbackMachine>;
  send: (event: PlaybackEvent) => void;
  /** Tighter spacing for a bar docked to the bottom of the viewport. */
  docked?: boolean;
  /**
   * One row attached under a canvas: step buttons, seek and speed together
   * (the seek wraps to its own line on phones).
   */
  attached?: boolean;
}

export default function PlaybackBar({
  state,
  send,
  docked = false,
  attached = false,
}: Props) {
  const { stepIndex, totalSteps, speedMs } = state.context;
  const playing = state.matches('playing');
  if (attached)
    return (
      <div
        data-playback-bar="attached"
        className="mt-2 flex flex-wrap items-center gap-2 border-t border-line pt-2"
      >
        <button
          aria-label="Previous step"
          onClick={() => send({ type: 'PREV' })}
          disabled={stepIndex === 0}
          className="min-h-11 min-w-11 border border-line px-3 py-2 text-sm disabled:opacity-30"
        >
          ←
        </button>
        <button
          aria-label={playing ? 'Pause' : 'Play'}
          onClick={() => send({ type: playing ? 'PAUSE' : 'PLAY' })}
          className="min-h-11 min-w-24 bg-action px-4 py-2 text-sm font-semibold text-canvas"
        >
          {playing ? 'Pause' : state.matches('completed') ? 'Replay' : 'Play'}
        </button>
        <button
          aria-label="Next step"
          onClick={() => send({ type: 'NEXT' })}
          disabled={stepIndex >= totalSteps - 1}
          className="min-h-11 min-w-11 border border-line px-3 py-2 text-sm disabled:opacity-30"
        >
          →
        </button>
        <select
          aria-label="Playback speed"
          value={speedMs}
          onChange={(event) =>
            send({ type: 'SPEED', speedMs: Number(event.target.value) })
          }
          className="order-none ml-auto min-h-11 border border-line bg-surface px-2 py-2 text-sm text-ink-soft sm:order-last sm:ml-0"
        >
          <option value={1200}>0.5×</option>
          <option value={700}>1×</option>
          <option value={400}>1.5×</option>
          <option value={220}>2×</option>
        </select>
        <div className="flex min-w-0 basis-full items-center gap-3 sm:basis-auto sm:flex-1">
          <input
            aria-label="Seek animation step"
            type="range"
            min={0}
            max={Math.max(0, totalSteps - 1)}
            value={stepIndex}
            onChange={(event) =>
              send({ type: 'SEEK', index: Number(event.target.value) })
            }
            className="h-11 min-w-0 flex-1 cursor-pointer accent-action"
          />
          <span className="min-w-12 text-right font-mono text-xs text-subtle">
            {stepIndex + 1} / {totalSteps}
          </span>
        </div>
      </div>
    );
  return (
    <div
      data-playback-bar
      className={`border-t border-line ${docked ? 'pt-2 sm:mt-5 sm:pt-4' : 'mt-5 pt-4'}`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <button
          aria-label="Previous step"
          onClick={() => send({ type: 'PREV' })}
          disabled={stepIndex === 0}
          className="min-h-11 min-w-11 border border-line px-3 py-2 text-sm disabled:opacity-30"
        >
          ←
        </button>
        <button
          aria-label={state.matches('playing') ? 'Pause' : 'Play'}
          onClick={() =>
            send({ type: state.matches('playing') ? 'PAUSE' : 'PLAY' })
          }
          className="min-h-11 min-w-24 bg-action px-4 py-2 text-sm font-semibold text-canvas"
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
          className="min-h-11 min-w-11 border border-line px-3 py-2 text-sm disabled:opacity-30"
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
            className="min-h-11 border border-line bg-surface px-2 py-2 text-ink-soft"
          >
            <option value={1200}>0.5×</option>
            <option value={700}>1×</option>
            <option value={400}>1.5×</option>
            <option value={220}>2×</option>
          </select>
        </label>
      </div>
      <div
        className={`flex items-center gap-3 ${docked ? 'mt-1 sm:mt-4' : 'mt-4'}`}
      >
        <input
          aria-label="Seek animation step"
          type="range"
          min={0}
          max={Math.max(0, totalSteps - 1)}
          value={stepIndex}
          onChange={(event) =>
            send({ type: 'SEEK', index: Number(event.target.value) })
          }
          className="h-11 min-w-0 flex-1 cursor-pointer accent-action"
        />
        <span className="min-w-16 text-right font-mono text-xs text-subtle sm:text-[10px]">
          {stepIndex + 1} / {totalSteps}
        </span>
      </div>
      <p
        className={`text-[11px] text-faint ${docked ? 'hidden sm:mt-3 sm:block' : 'mt-3'}`}
      >
        Space play/pause · ←/→ step
      </p>
    </div>
  );
}
