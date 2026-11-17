'use client';

import { useEffect, useMemo, useReducer, useRef } from 'react';
import type { RuntimeScene } from '@algoflow/contracts';
import {
  countChallenges,
  initialPredictState,
  isComplete,
  isWaiting,
  predictReducer,
  type PredictEvent,
  type PredictState,
} from '../../lib/animation/predictChallenge';
import RuntimeSceneViz from '../animation/RuntimeSceneViz';

/** How long a step without a question stays on screen before the next one. */
const STEP_MS = 1100;
/** How long the confirmation shows before the predicted step is revealed. */
const REVEAL_MS = 650;

/**
 * Predict-first mode for any scene whose steps carry challenges: the scene
 * plays by itself, stops at each question, and reveals the next step only
 * after the learner commits to an answer. Answers are plain buttons, so it
 * works the same with a mouse, a keyboard or a finger.
 */
export default function PredictChallenge({
  scene,
  onWatchScene,
}: {
  scene: RuntimeScene;
  onWatchScene?: () => void;
}) {
  const steps = scene.steps;
  const [state, send] = useReducer(
    (current: PredictState, event: PredictEvent) =>
      predictReducer(steps, current, event),
    initialPredictState,
  );
  const total = useMemo(() => countChallenges(steps), [steps]);
  const step = steps[state.stepIndex];
  const challenge = step.challenge;
  const waiting = isWaiting(steps, state);
  const complete = isComplete(steps, state);

  useEffect(() => {
    if (waiting || complete) return;
    const timer = setTimeout(
      () => send({ type: 'ADVANCE' }),
      state.solved ? REVEAL_MS : STEP_MS,
    );
    return () => clearTimeout(timer);
  }, [waiting, complete, state.solved, state.stepIndex]);

  // The docked answers may cover the bottom of a tall scene (a grid with its
  // queue). On entry, scroll just enough for the whole scene to clear the
  // dock; `nearest` leaves the page alone when it already does.
  const root = useRef<HTMLDivElement>(null);
  const dock = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const view = root.current?.querySelector<HTMLElement>('[data-scene]');
    if (!view || !dock.current) return;
    const covered =
      window.innerHeight - dock.current.getBoundingClientRect().top;
    view.style.scrollMarginBottom = `${Math.max(0, covered) + 12}px`;
    view.style.scrollMarginTop = '5rem';
    view.scrollIntoView({
      block: 'nearest',
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'auto'
        : 'smooth',
    });
  }, []);

  // Answering replaces the buttons (the next question, the watch step or the
  // summary). When the focused one goes, hand focus to the first live control
  // in the dock instead of letting it fall back to <body>.
  const answers = useRef<HTMLDivElement>(null);
  const focusInDock = useRef(false);
  useEffect(() => {
    if (!focusInDock.current) return;
    const active = document.activeElement;
    if (active && active !== document.body && active.isConnected) return;
    answers.current
      ?.querySelector<HTMLElement>('button:not([aria-disabled="true"])')
      ?.focus({ preventScroll: true });
  }, [state.stepIndex, complete]);

  const wrong = state.wrongPicks.length > 0;
  return (
    <div data-predict-challenge ref={root}>
      <RuntimeSceneViz
        scene={scene}
        step={step}
        stepIndex={state.stepIndex}
        sceneFirst
      />
      {/* Docked like the playback bar, so the answers stay within reach while
          the scene above them changes. */}
      <div
        ref={dock}
        onFocus={() => {
          focusInDock.current = true;
        }}
        onBlur={(event) => {
          const next = event.relatedTarget;
          focusInDock.current = next
            ? Boolean(dock.current?.contains(next))
            : !event.target.isConnected;
        }}
        className="sticky bottom-[calc(2.5rem+max(.45rem,env(safe-area-inset-bottom)))] z-10 -mx-4 border-t border-line bg-canvas px-4 pb-2 pt-2 sm:bottom-0 sm:mx-0 sm:px-0 sm:pb-1 sm:pt-3"
      >
        <div className="flex items-center justify-between gap-3">
          <p className="min-w-0 font-mono text-xs uppercase tracking-[0.12em] text-muted sm:text-[10px] sm:tracking-[0.2em]">
            Predict
            <span
              data-predict-score
              className="ml-2 whitespace-nowrap normal-case tracking-normal text-subtle"
            >
              {state.asked}/{total} · {state.firstTry} first try
            </span>
          </p>
          <button
            onClick={() => send({ type: 'RESET' })}
            disabled={state.stepIndex === 0 && state.asked === 0}
            className="-my-2 min-h-11 shrink-0 px-2 text-xs text-subtle underline-offset-4 hover:text-ink hover:underline disabled:opacity-30"
          >
            Restart
          </button>
        </div>
        <div
          className="mt-1 h-1 overflow-hidden rounded-full bg-surface-raised"
          role="progressbar"
          aria-label="Challenge progress"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={state.asked}
        >
          <div
            className="h-full bg-action transition-[width] duration-300"
            style={{ width: `${total ? (state.asked / total) * 100 : 0}%` }}
          />
        </div>

        <div ref={answers} aria-live="polite" className="mt-2 min-h-[5.5rem]">
          {complete ? (
            <div data-predict-phase="complete">
              <p className="text-sm font-semibold text-ink">
                Challenge complete: {state.firstTry} of {total} predicted on the
                first try.
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  onClick={() => send({ type: 'RESET' })}
                  className="button-primary min-h-11 px-4 py-2 text-sm"
                >
                  Try again
                </button>
                {onWatchScene && (
                  <button
                    onClick={onWatchScene}
                    className="button-secondary min-h-11 px-4 py-2 text-sm"
                  >
                    Watch the scene
                  </button>
                )}
              </div>
            </div>
          ) : challenge ? (
            <div data-predict-phase={state.solved ? 'solved' : 'asking'}>
              <p className="text-sm font-semibold leading-5 text-ink">
                {challenge.prompt}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {challenge.options.map((option, index) => {
                  const tried = state.wrongPicks.includes(index);
                  const right = state.solved && index === challenge.answer;
                  // aria-disabled, not disabled: a disabled button drops the
                  // keyboard focus that just picked it.
                  const inert = tried || state.solved;
                  return (
                    <button
                      key={option}
                      data-predict-option={index}
                      onClick={() => {
                        if (!inert) send({ type: 'PICK', option: index });
                      }}
                      aria-disabled={inert || undefined}
                      aria-pressed={right}
                      className={`min-h-11 min-w-[4.5rem] flex-1 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors aria-disabled:cursor-not-allowed ${
                        right
                          ? 'border-success bg-success-muted text-ink'
                          : tried
                            ? 'border-danger/60 bg-danger-muted text-faint line-through'
                            : 'border-line-strong bg-surface-raised text-ink hover:border-ink'
                      }`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
              {(wrong || state.solved) && (
                <p
                  data-predict-feedback={state.solved ? 'correct' : 'wrong'}
                  className={`mt-2 text-sm leading-5 ${state.solved ? 'text-success' : 'text-ink-soft'}`}
                >
                  {state.solved
                    ? wrong
                      ? 'That is the one. Watch it happen.'
                      : 'Correct. Watch it happen.'
                    : `Not quite. ${challenge.explanation} Pick again.`}
                </p>
              )}
            </div>
          ) : (
            <div
              data-predict-phase="watching"
              className="flex items-start justify-between gap-3 pt-1"
            >
              <p className="text-sm leading-6 text-subtle">
                Watch this step play out. The next question appears when there
                is something to predict.
              </p>
              <button
                data-predict-skip
                onClick={() => send({ type: 'SKIP' })}
                className="button-secondary min-h-11 shrink-0 px-3 py-2 text-xs"
              >
                Next question
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
