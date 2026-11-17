'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import {
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
import {
  INSTANT,
  tokenExitVariant,
} from '../../lib/animation/runtimeSceneMotion';

const TONE_VAR: Record<RuntimeSceneRegionTone, string> = {
  green: '--color-success',
  red: '--color-danger',
  yellow: '--color-warning',
  orange: '--color-scene-orange',
  teal: '--color-scene-teal',
};

const LINE_HEIGHT = 26;
const CODE_PADDING = 8;
// Longer snippets scroll inside the panel so the sticky player stays on screen.
const CODE_VISIBLE_LINES = 6;

const tone = (variable: string, alpha = 1) =>
  `rgb(var(${variable}) / ${alpha})`;

const MOVE: Transition = { type: 'spring', stiffness: 240, damping: 26 };

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

const tokenClass = (region: RuntimeSceneRegion) =>
  `rounded-md border py-1 font-mono text-[11px] shadow-sm transition-colors duration-300 ${region.kind === 'pipeline' ? 'break-words px-1.5 text-center' : 'whitespace-nowrap px-2.5'}`;

interface LeavingToken {
  token: RuntimeSceneToken;
  /** Where it sat among its region's tokens, so it fades out in place. */
  index: number;
}

const EXIT_MS = 240;

/** Tokens of `previous` that no longer exist anywhere in `next`. */
function poppedTokens(
  previous: RuntimeSceneStep,
  next: RuntimeSceneStep,
): LeavingToken[] {
  const nextIds = new Set(next.tokens.map((token) => token.id));
  return previous.tokens
    .filter((token) => !nextIds.has(token.id))
    .map((token) => ({
      token,
      index: previous.tokens
        .filter((item) => item.regionId === token.regionId)
        .indexOf(token),
    }));
}

/**
 * A popped token shrinking away. It is a plain element without a layoutId:
 * wrapping tokens in AnimatePresence instead keeps every token that *moved*
 * to another region mounted (invisible, but still taking space) because its
 * shared-layout exit never completes.
 */
function Leaving({
  token,
  region,
}: {
  token: RuntimeSceneToken;
  region: RuntimeSceneRegion;
}) {
  return (
    <motion.div
      aria-hidden
      data-leaving={token.id}
      initial={{ opacity: 1, scale: 1 }}
      variants={{ exit: tokenExitVariant(token.id, false) }}
      animate="exit"
      className={tokenClass(region)}
      style={tokenStyle(token, region)}
    >
      {token.label}
    </motion.div>
  );
}

function Token({
  token,
  region,
  linkedRegion,
  isNew,
  reduced,
}: {
  token: RuntimeSceneToken;
  region: RuntimeSceneRegion;
  linkedRegion?: RuntimeSceneRegion;
  isNew: boolean;
  reduced: boolean;
}) {
  const style = tokenStyle(token, region);
  return (
    <motion.div
      layoutId={token.id}
      layout="position"
      data-token={token.id}
      initial={isNew && !reduced ? { opacity: 0, scale: 0.6 } : false}
      animate={{ opacity: 1, scale: 1 }}
      transition={reduced ? INSTANT : MOVE}
      className={tokenClass(region)}
      style={style}
    >
      {token.label}
      {linkedRegion && (
        <span
          data-link={linkedRegion.id}
          className="ml-2 rounded border px-1 py-px text-[9px] uppercase tracking-[0.08em]"
          style={{
            borderColor: tone(TONE_VAR[linkedRegion.tone], 0.7),
            color: tone(TONE_VAR[linkedRegion.tone]),
          }}
        >
          <span aria-hidden>→ </span>
          <span className="sr-only">references </span>
          {linkedRegion.label}
        </span>
      )}
      {token.progress !== undefined && (
        <span
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(token.progress * 100)}
          className="mt-1 block h-1 overflow-hidden rounded-full"
          style={{ background: tone('--color-line-strong') }}
        >
          <span
            className="block h-full rounded-full transition-[width] duration-700 ease-out motion-reduce:transition-none"
            style={{
              width: `${token.progress * 100}%`,
              background: style.borderColor,
            }}
          />
        </span>
      )}
    </motion.div>
  );
}

const BODY_CLASS: Record<RuntimeSceneRegion['kind'], string> = {
  // column-reverse: the first token sits at the bottom, so the stack grows up.
  stack: 'min-h-[132px] flex-col-reverse items-stretch justify-start',
  // FIFO: the head of the queue is the leftmost token.
  queue: 'min-h-[48px] flex-row items-center overflow-x-auto',
  box: 'min-h-[56px] flex-row flex-wrap content-start items-start',
  console: 'min-h-[48px] flex-col',
  // One station of the strip: its tokens stack and may wrap their label.
  pipeline: 'min-h-[60px] flex-col items-stretch justify-start',
};

function Region({
  region,
  tokens,
  leaving,
  active,
  previousIds,
  regionById,
  reduced,
  className = '',
  style,
}: {
  region: RuntimeSceneRegion;
  tokens: RuntimeSceneToken[];
  leaving: LeavingToken[];
  active: boolean;
  previousIds: Set<string>;
  regionById: Map<string, RuntimeSceneRegion>;
  reduced: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  const variable = TONE_VAR[region.tone];
  const station = region.kind === 'pipeline';
  const items: Array<RuntimeSceneToken | LeavingToken> = [...tokens];
  for (const item of leaving)
    items.splice(Math.min(item.index, items.length), 0, item);
  return (
    <section
      aria-label={region.label}
      data-region={region.id}
      data-active={active || undefined}
      className={`flex min-w-0 flex-col rounded-lg border transition-[border-color,background-color,box-shadow] duration-300 ${className}`}
      style={{
        ...style,
        borderColor: tone(variable, active ? 0.85 : 0.28),
        background: tone(variable, active ? 0.08 : 0.025),
        boxShadow: active ? `0 0 0 3px ${tone(variable, 0.12)}` : 'none',
      }}
    >
      <header
        className={`flex items-center justify-between gap-2 pt-2 ${station ? 'px-2' : 'px-3'}`}
      >
        <span
          className={`font-mono text-[10px] font-semibold uppercase ${station ? 'tracking-[0.06em]' : 'tracking-[0.18em]'}`}
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
        {items.length === 0 && !station && (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 flex items-center justify-center font-mono text-[10px] text-faint"
          >
            empty
          </span>
        )}
        {items.map((item) =>
          'token' in item ? (
            <Leaving
              key={`leaving-${item.token.id}`}
              token={item.token}
              region={region}
            />
          ) : (
            <Token
              key={item.id}
              token={item}
              region={region}
              linkedRegion={
                item.linkRegionId
                  ? regionById.get(item.linkRegionId)
                  : undefined
              }
              isNew={!previousIds.has(item.id)}
              reduced={reduced}
            />
          ),
        )}
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
  // Scroll the panel itself (never the page) to keep the active lines in view.
  const scroller = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const panel = scroller.current;
    if (!panel || first === null || last === null) return;
    const middle = CODE_PADDING + ((first + last + 1) / 2) * LINE_HEIGHT;
    panel.scrollTo({
      top: Math.max(0, middle - panel.clientHeight / 2),
      behavior: reduced ? 'auto' : 'smooth',
    });
  }, [first, last, reduced]);

  return (
    <div
      ref={scroller}
      className="overflow-auto rounded-lg border border-line bg-canvas/70"
      style={{
        maxHeight: CODE_VISIBLE_LINES * LINE_HEIGHT + CODE_PADDING * 2,
      }}
    >
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
      <ol className="min-h-[28px] px-3 pb-2 pt-1 font-mono text-[12px] text-ink">
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
  // What the previous rendered step contained, so only genuinely new tokens
  // and output lines animate in. Seeded with the first step for a static SSR.
  const previousIds = useRef(new Set(step.tokens.map((token) => token.id)));
  const previousOutputLength = useRef(step.output.length);
  useEffect(() => {
    previousIds.current = new Set(step.tokens.map((token) => token.id));
    previousOutputLength.current = step.output.length;
  }, [step]);

  // Popped tokens stay rendered just long enough to shrink away.
  const [shown, setShown] = useState<{
    step: RuntimeSceneStep;
    leaving: LeavingToken[];
  }>({ step, leaving: [] });
  if (shown.step !== step)
    setShown({
      step,
      leaving: reduced ? [] : poppedTokens(shown.step, step),
    });
  useEffect(() => {
    if (shown.leaving.length === 0) return;
    const timer = setTimeout(
      () => setShown((current) => ({ ...current, leaving: [] })),
      EXIT_MS,
    );
    return () => clearTimeout(timer);
  }, [shown]);

  const active = new Set(step.activeRegionIds ?? []);
  const tokensIn = (regionId: string) =>
    step.tokens.filter((token) => token.regionId === regionId);
  const byKind = (kind: RuntimeSceneRegion['kind']) =>
    scene.regions.filter((region) => region.kind === kind);
  const stacks = byKind('stack');
  const boxes = byKind('box');
  const queues = byKind('queue');
  const consoles = byKind('console');
  const pipeline = byKind('pipeline');
  const regionById = new Map(
    scene.regions.map((region) => [region.id, region]),
  );
  // Only scenes that model the event loop show its indicator.
  const hasEventLoop = scene.steps.some((item) => item.eventLoop !== undefined);
  const stackBusy = stacks.some((region) => tokensIn(region.id).length > 0);
  const regionProps = (region: RuntimeSceneRegion) => ({
    region,
    tokens: tokensIn(region.id),
    leaving: shown.leaving.filter((item) => item.token.regionId === region.id),
    active: active.has(region.id),
    previousIds: previousIds.current,
    regionById,
    reduced,
  });

  return (
    <section
      className="border-y border-line bg-surface/40 py-3"
      data-viz="runtime-scene"
    >
      <header className="flex items-center justify-between gap-3 px-1">
        <p className="eyebrow">runtime scene</p>
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-subtle">
          {scene.code.language}
        </span>
      </header>
      <div
        aria-live="polite"
        className="mt-3 min-h-[7rem] border-l-2 border-line-strong pl-4"
      >
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-subtle">
          Step {stepIndex + 1} of {scene.steps.length}
        </p>
        <p className="mt-1 text-sm font-semibold text-ink">{step.label}</p>
        <p className="mt-1 text-sm leading-6 text-ink-soft">{step.narration}</p>
      </div>
      <div className="mt-3 grid gap-3">
        <CodePanel scene={scene} step={step} reduced={reduced} />
        <LayoutGroup id="runtime-scene">
          {pipeline.length > 0 && (
            <div className="overflow-x-auto sm:overflow-visible">
              <ol
                data-pipeline
                className="flex min-w-max items-stretch gap-1 sm:min-w-0"
              >
                {pipeline.map((region, index) => (
                  <li
                    key={region.id}
                    className="flex min-w-[84px] flex-1 basis-0 items-stretch gap-1"
                  >
                    {index > 0 && (
                      <span
                        aria-hidden
                        className="self-center font-mono text-sm text-subtle"
                      >
                        ›
                      </span>
                    )}
                    <Region {...regionProps(region)} className="flex-1" />
                  </li>
                ))}
              </ol>
            </div>
          )}
          {(stacks.length > 0 || boxes.length > 0 || hasEventLoop) && (
            <div className="grid gap-3 sm:grid-cols-2">
              {stacks.map((region) => (
                <Region
                  key={region.id}
                  {...regionProps(region)}
                  className="sm:[grid-row:span_var(--stack-rows)]"
                  style={
                    {
                      '--stack-rows': Math.max(
                        1,
                        boxes.length + (hasEventLoop ? 1 : 0),
                      ),
                    } as CSSProperties
                  }
                />
              ))}
              {boxes.map((region, index) => (
                <Region
                  key={region.id}
                  {...regionProps(region)}
                  className={
                    // With no stack beside them, a trailing odd box takes the
                    // full row instead of half of it.
                    index === boxes.length - 1 &&
                    stacks.length === 0 &&
                    !hasEventLoop &&
                    boxes.length % 2 === 1
                      ? 'sm:col-span-2'
                      : ''
                  }
                />
              ))}
              {hasEventLoop && (
                <EventLoopIndicator
                  checking={step.eventLoop === 'checking'}
                  stackBusy={stackBusy}
                />
              )}
            </div>
          )}
          {queues.length > 0 && (
            <div
              className={`grid gap-3 ${queues.length > 1 ? 'sm:grid-cols-2' : ''}`}
            >
              {queues.map((region) => (
                <Region key={region.id} {...regionProps(region)} />
              ))}
            </div>
          )}
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
    </section>
  );
}
