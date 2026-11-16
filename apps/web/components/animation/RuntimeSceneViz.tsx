'use client';

import { useEffect, useRef, type CSSProperties } from 'react';
import {
  AnimatePresence,
  LayoutGroup,
  motion,
  useReducedMotion,
  type Transition,
} from 'framer-motion';
import type {
  RuntimeScene,
  RuntimeSceneRegion,
  RuntimeSceneRegionTone,
  RuntimeSceneStep,
  RuntimeSceneToken,
} from '@algoflow/contracts';

const TONE_VAR: Record<RuntimeSceneRegionTone, string> = {
  green: '--color-success',
  red: '--color-danger',
  yellow: '--color-warning',
  orange: '--color-scene-orange',
  teal: '--color-scene-teal',
};

const LINE_HEIGHT = 28;
const CODE_PADDING = 8;

const tone = (variable: string, alpha = 1) =>
  `rgb(var(${variable}) / ${alpha})`;

const MOVE: Transition = { type: 'spring', stiffness: 240, damping: 26 };
const INSTANT: Transition = { duration: 0 };

function tokenStyle(
  token: RuntimeSceneToken,
  region: RuntimeSceneRegion,
): CSSProperties {
  if (token.tone === 'muted')
    return {
      borderColor: tone('--color-line-strong'),
      background: tone('--color-surface-raised'),
      color: tone('--color-muted'),
    };
  const variable =
    token.tone === 'ok'
      ? '--color-success'
      : token.tone === 'error'
        ? '--color-danger'
        : TONE_VAR[region.tone];
  return {
    borderColor: tone(variable, 0.75),
    background: tone(variable, 0.14),
    color: tone('--color-ink'),
  };
}

function Token({
  token,
  region,
  isNew,
  reduced,
}: {
  token: RuntimeSceneToken;
  region: RuntimeSceneRegion;
  isNew: boolean;
  reduced: boolean;
}) {
  return (
    <motion.div
      layoutId={token.id}
      layout="position"
      data-token={token.id}
      initial={isNew && !reduced ? { opacity: 0, scale: 0.6 } : false}
      animate={{ opacity: 1, scale: 1 }}
      variants={{
        // Tokens that moved to another region vanish instantly here; their
        // layoutId twin flies from this spot. Popped tokens shrink away.
        exit: (currentIds: Set<string>) =>
          currentIds.has(token.id) || reduced
            ? { opacity: 0, transition: INSTANT }
            : { opacity: 0, scale: 0.6, transition: { duration: 0.22 } },
      }}
      exit="exit"
      transition={reduced ? INSTANT : MOVE}
      className="whitespace-nowrap rounded-md border px-2.5 py-1 font-mono text-[11px] shadow-sm"
      style={tokenStyle(token, region)}
    >
      {token.label}
    </motion.div>
  );
}

const BODY_CLASS: Record<RuntimeSceneRegion['kind'], string> = {
  // column-reverse: the first token sits at the bottom, so the stack grows up.
  stack: 'min-h-[176px] flex-col-reverse items-stretch justify-start',
  // FIFO: the head of the queue is the leftmost token.
  queue: 'min-h-[48px] flex-row items-center overflow-x-auto',
  box: 'min-h-[72px] flex-row flex-wrap content-start items-start',
  console: 'min-h-[48px] flex-col',
};

function Region({
  region,
  tokens,
  active,
  currentIds,
  previousIds,
  reduced,
  className = '',
}: {
  region: RuntimeSceneRegion;
  tokens: RuntimeSceneToken[];
  active: boolean;
  currentIds: Set<string>;
  previousIds: Set<string>;
  reduced: boolean;
  className?: string;
}) {
  const variable = TONE_VAR[region.tone];
  return (
    <section
      aria-label={region.label}
      data-region={region.id}
      data-active={active || undefined}
      className={`flex min-w-0 flex-col rounded-lg border transition-[border-color,background-color,box-shadow] duration-300 ${className}`}
      style={{
        borderColor: tone(variable, active ? 0.85 : 0.28),
        background: tone(variable, active ? 0.08 : 0.025),
        boxShadow: active ? `0 0 0 3px ${tone(variable, 0.12)}` : 'none',
      }}
    >
      <header className="flex items-center justify-between gap-2 px-3 pt-2">
        <span
          className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em]"
          style={{ color: tone(variable) }}
        >
          {region.label}
        </span>
        {region.kind === 'queue' && (
          <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-faint">
            ← next out
          </span>
        )}
      </header>
      <div
        className={`relative flex flex-1 gap-1.5 p-2 ${BODY_CLASS[region.kind]}`}
      >
        {tokens.length === 0 && (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 flex items-center justify-center font-mono text-[10px] text-faint"
          >
            empty
          </span>
        )}
        <AnimatePresence mode="popLayout" initial={false} custom={currentIds}>
          {tokens.map((token) => (
            <Token
              key={token.id}
              token={token}
              region={region}
              isNew={!previousIds.has(token.id)}
              reduced={reduced}
            />
          ))}
        </AnimatePresence>
      </div>
    </section>
  );
}

function CodePanel({
  scene,
  step,
  reduced,
}: {
  scene: RuntimeScene;
  step: RuntimeSceneStep;
  reduced: boolean;
}) {
  const highlighted = new Set(step.codeLines);
  const first = step.codeLines.length ? Math.min(...step.codeLines) : null;
  const last = step.codeLines.length ? Math.max(...step.codeLines) : null;
  // Keep the band where it was while no line is active, so it fades in place.
  const lastBand = useRef({ first: first ?? 0, last: last ?? 0 });
  const band =
    first === null || last === null ? lastBand.current : { first, last };
  useEffect(() => {
    if (first !== null && last !== null) lastBand.current = { first, last };
  }, [first, last]);

  return (
    <div className="overflow-x-auto rounded-lg border border-line bg-canvas/70">
      <div className="relative min-w-max" style={{ padding: CODE_PADDING }}>
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 border-l-2"
          style={{
            borderColor: tone('--color-warning'),
            background: tone('--color-warning', 0.1),
          }}
          initial={false}
          animate={{
            top: CODE_PADDING + band.first * LINE_HEIGHT,
            height: (band.last - band.first + 1) * LINE_HEIGHT,
            opacity: first === null ? 0 : 1,
          }}
          transition={reduced ? INSTANT : MOVE}
        />
        <ol className="relative font-mono text-[12px]">
          {scene.code.lines.map((line, index) => (
            <li
              key={index}
              aria-current={highlighted.has(index) ? 'step' : undefined}
              className="flex items-center gap-3 whitespace-pre pr-4"
              style={{ height: LINE_HEIGHT }}
            >
              <span className="w-5 select-none text-right text-faint">
                {index + 1}
              </span>
              <code
                className={`transition-colors duration-300 ${highlighted.has(index) ? 'text-ink' : 'text-subtle'}`}
              >
                {line}
              </code>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

function EventLoopIndicator({
  checking,
  stackBusy,
}: {
  checking: boolean;
  stackBusy: boolean;
}) {
  return (
    <div
      data-event-loop={checking ? 'checking' : 'idle'}
      className={`flex items-center gap-3 rounded-lg border px-3 py-2 transition-colors duration-300 ${checking ? 'border-line-strong bg-surface-raised text-ink' : 'border-line text-faint'}`}
    >
      <span className="relative flex h-8 w-8 shrink-0 items-center justify-center">
        {checking && (
          <span
            aria-hidden
            className="absolute inset-0 animate-ping rounded-full border border-current opacity-30 motion-reduce:animate-none"
          />
        )}
        <svg
          viewBox="0 0 24 24"
          aria-hidden
          className={`h-7 w-7 ${checking ? 'animate-spin motion-reduce:animate-none' : ''}`}
          style={{ animationDuration: '1.4s' }}
        >
          <path
            d="M20.5 12a8.5 8.5 0 1 1-2.5-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M18.5 2.5v4h-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <div className="min-w-0">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em]">
          Event loop
        </p>
        <p className="mt-0.5 text-xs text-subtle">
          {checking
            ? 'Stack empty: checking microtasks first, then one task'
            : stackBusy
              ? 'Waiting for the call stack to empty'
              : 'Idle'}
        </p>
      </div>
    </div>
  );
}

function ConsolePanel({
  region,
  output,
  previousLength,
  active,
  reduced,
}: {
  region: RuntimeSceneRegion;
  output: string[];
  previousLength: number;
  active: boolean;
  reduced: boolean;
}) {
  const variable = TONE_VAR[region.tone];
  return (
    <section
      aria-label={region.label}
      data-region={region.id}
      className="rounded-lg border bg-canvas/70 transition-[border-color] duration-300"
      style={{ borderColor: tone(variable, active ? 0.8 : 0.28) }}
    >
      <header className="px-3 pt-2">
        <span
          className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em]"
          style={{ color: tone(variable) }}
        >
          {region.label}
        </span>
      </header>
      <ol className="min-h-[44px] px-3 pb-2 pt-1 font-mono text-[12px] text-ink">
        {output.map((line, index) => (
          <motion.li
            key={`${index}-${line}`}
            initial={
              index >= previousLength && !reduced
                ? { opacity: 0, x: -8 }
                : false
            }
            animate={{ opacity: 1, x: 0 }}
            transition={reduced ? INSTANT : { duration: 0.3 }}
            className="flex gap-2"
          >
            <span aria-hidden className="text-faint">
              ›
            </span>
            {line}
          </motion.li>
        ))}
      </ol>
    </section>
  );
}

export default function RuntimeSceneViz({
  scene,
  step,
  stepIndex,
}: {
  scene: RuntimeScene;
  step: RuntimeSceneStep;
  stepIndex: number;
}) {
  const reduced = Boolean(useReducedMotion());
  const currentIds = new Set(step.tokens.map((token) => token.id));
  // What the previous rendered step contained, so only genuinely new tokens
  // and output lines animate in. Seeded with the first step for a static SSR.
  const previousIds = useRef(currentIds);
  const previousOutputLength = useRef(step.output.length);
  useEffect(() => {
    previousIds.current = new Set(step.tokens.map((token) => token.id));
    previousOutputLength.current = step.output.length;
  }, [step]);

  const active = new Set(step.activeRegionIds ?? []);
  const tokensIn = (regionId: string) =>
    step.tokens.filter((token) => token.regionId === regionId);
  const byKind = (kind: RuntimeSceneRegion['kind']) =>
    scene.regions.filter((region) => region.kind === kind);
  const stacks = byKind('stack');
  const boxes = byKind('box');
  const queues = byKind('queue');
  const consoles = byKind('console');
  const stackBusy = stacks.some((region) => tokensIn(region.id).length > 0);
  const regionProps = (region: RuntimeSceneRegion) => ({
    region,
    tokens: tokensIn(region.id),
    active: active.has(region.id),
    currentIds,
    previousIds: previousIds.current,
    reduced,
  });

  return (
    <section
      className="border-y border-line bg-surface/40 py-5"
      data-viz="runtime-scene"
    >
      <header className="flex flex-wrap items-end justify-between gap-3 px-1">
        <div>
          <p className="eyebrow">runtime scene</p>
          <p className="mt-2 text-sm text-ink-soft">{step.label}</p>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-subtle">
          {scene.code.language}
        </span>
      </header>
      <div className="mt-4 grid gap-3">
        <CodePanel scene={scene} step={step} reduced={reduced} />
        <LayoutGroup id="runtime-scene">
          <div className="grid gap-3 sm:grid-cols-2">
            {stacks.map((region) => (
              <Region
                key={region.id}
                {...regionProps(region)}
                className="sm:row-span-2"
              />
            ))}
            {boxes.map((region) => (
              <Region key={region.id} {...regionProps(region)} />
            ))}
            <EventLoopIndicator
              checking={step.eventLoop === 'checking'}
              stackBusy={stackBusy}
            />
          </div>
          {queues.map((region) => (
            <Region key={region.id} {...regionProps(region)} />
          ))}
        </LayoutGroup>
        {consoles.map((region) => (
          <ConsolePanel
            key={region.id}
            region={region}
            output={step.output}
            previousLength={previousOutputLength.current}
            active={active.has(region.id)}
            reduced={reduced}
          />
        ))}
      </div>
      <div
        aria-live="polite"
        className="mt-4 border-l-2 border-line-strong pl-4"
      >
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-subtle">
          Step {stepIndex + 1} of {scene.steps.length}
        </p>
        <p className="mt-1 text-sm font-semibold text-ink">{step.label}</p>
        <p className="mt-1 text-sm leading-6 text-ink-soft">{step.narration}</p>
      </div>
    </section>
  );
}
