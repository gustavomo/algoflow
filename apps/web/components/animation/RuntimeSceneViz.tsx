'use client';

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import { LayoutGroup, motion, useReducedMotion } from 'framer-motion';
import type {
  RuntimeScene,
  RuntimeSceneActionTone,
  RuntimeSceneRegion,
  RuntimeSceneStep,
  RuntimeSceneToken,
} from '@algoflow/contracts';
import {
  INSTANT,
  MOVE,
  tokenExitVariant,
} from '../../lib/animation/runtimeSceneMotion';
import { TONE_VAR, tone } from '../../lib/animation/runtimeSceneTone';
import { ArrayRegion, GridRegion } from './RuntimeSceneData';
import { PlotRegion } from './RuntimeScenePlot';
import { TableRegions } from './RuntimeSceneTable';

const ACTION_TONE_VAR: Record<RuntimeSceneActionTone, string> = {
  compare: '--color-warning',
  swap: '--color-scene-orange',
  ok: '--color-success',
  error: '--color-danger',
};

// Fallback row height until the real (possibly wrapped) lines are measured.
const LINE_HEIGHT = 26;
const CODE_PADDING = 8;

// The DOM is only measured in the browser; on the server this is a no-op.
const useIsomorphicLayoutEffect =
  typeof window === 'undefined' ? useEffect : useLayoutEffect;

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
  `max-w-full rounded-md border py-1 font-mono text-xs shadow-sm transition-colors duration-300 sm:text-[11px] ${region.kind === 'pipeline' ? 'break-words px-1.5 text-center' : region.kind === 'queue' ? 'whitespace-nowrap px-2.5' : 'break-words px-2 sm:whitespace-nowrap sm:px-2.5'}`;

interface LeavingToken {
  token: RuntimeSceneToken;
  /** Where it sat among its region's tokens, so it fades out in place. */
  index: number;
}

const EXIT_MS = 240;
const FLY_IN_MS = 420;

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
  // A token discovered on a grid flies in from its cell instead of fading in.
  const element = useRef<HTMLDivElement>(null);
  const fliesIn = useRef(
    isNew && !reduced && token.cell && token.cell.regionId !== region.id
      ? `${token.cell.regionId}:${token.cell.index}`
      : null,
  );
  useIsomorphicLayoutEffect(() => {
    const node = element.current;
    const origin =
      fliesIn.current &&
      node
        ?.closest('[data-scene]')
        ?.querySelector(`[data-grid-cell="${fliesIn.current}"]`);
    if (!node || !origin || typeof node.animate !== 'function') return;
    const from = origin.getBoundingClientRect();
    const to = node.getBoundingClientRect();
    const dx = from.left + from.width / 2 - (to.left + to.width / 2);
    const dy = from.top + from.height / 2 - (to.top + to.height / 2);
    node.animate(
      [
        { transform: `translate(${dx}px, ${dy}px) scale(0.7)`, opacity: 0.5 },
        { transform: 'translate(0, 0) scale(1)', opacity: 1 },
      ],
      { duration: FLY_IN_MS, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' },
    );
  }, []);
  return (
    <motion.div
      ref={element}
      layoutId={token.id}
      layout="position"
      data-token={token.id}
      initial={
        isNew && !reduced && !fliesIn.current
          ? { opacity: 0, scale: 0.6 }
          : false
      }
      animate={{ opacity: 1, scale: 1 }}
      transition={reduced ? INSTANT : MOVE}
      className={tokenClass(region)}
      style={style}
    >
      {token.label}
      {linkedRegion && (
        <span
          data-link={linkedRegion.id}
          className="ml-1.5 inline-block whitespace-nowrap rounded border px-1 py-px text-[11px] uppercase tracking-[0.04em] sm:ml-2 sm:text-[9px] sm:tracking-[0.08em]"
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
  stack:
    'min-h-[88px] flex-col-reverse items-stretch justify-start sm:min-h-[132px]',
  // FIFO: the head of the queue is the leftmost token.
  queue: 'min-h-[44px] flex-row items-center overflow-x-auto sm:min-h-[48px]',
  box: 'min-h-[44px] flex-row flex-wrap content-start items-start sm:min-h-[56px]',
  console: 'min-h-[48px] flex-col',
  // One station of the strip: its tokens stack and may wrap their label.
  pipeline: 'min-h-[52px] flex-col items-stretch justify-start sm:min-h-[60px]',
  // Data regions are drawn by their own components, not by Region.
  array: '',
  grid: '',
  table: '',
  plot: '',
};

function Region({
  region,
  tokens,
  leaving,
  active,
  previousIds,
  regionById,
  reduced,
  compact = false,
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
  /** Shares a phone row with another region, so the header drops its hint. */
  compact?: boolean;
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
        className={`flex items-center justify-between gap-2 pt-1.5 sm:pt-2 ${station ? 'px-2' : 'px-2 sm:px-3'}`}
      >
        <span
          className={`font-mono text-xs font-semibold uppercase sm:text-[10px] ${station ? 'tracking-[0.02em] sm:tracking-[0.06em]' : 'tracking-[0.08em] sm:tracking-[0.18em]'}`}
          style={{ color: tone(variable) }}
        >
          {region.label}
        </span>
        {region.kind === 'queue' && (
          <span
            className={`whitespace-nowrap font-mono text-[11px] uppercase tracking-[0.06em] text-faint sm:inline sm:text-[9px] sm:tracking-[0.14em] ${compact ? 'hidden' : ''}`}
          >
            ← next out
          </span>
        )}
      </header>
      <div
        className={`relative flex flex-1 gap-1.5 p-1.5 sm:p-2 ${BODY_CLASS[region.kind]}`}
      >
        {items.length === 0 && !station && (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 flex items-center justify-center font-mono text-xs text-faint sm:text-[10px]"
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
  sceneFirst,
  className = '',
}: {
  scene: RuntimeScene;
  step: RuntimeSceneStep;
  reduced: boolean;
  sceneFirst: boolean;
  className?: string;
}) {
  const highlighted = new Set(step.codeLines);
  const first = step.codeLines.length ? Math.min(...step.codeLines) : null;
  const last = step.codeLines.length ? Math.max(...step.codeLines) : null;
  // Lines soft-wrap on phones, so the band is measured from the rendered rows
  // instead of assuming one fixed-height row per line.
  const scroller = useRef<HTMLDivElement>(null);
  const rows = useRef<Array<HTMLLIElement | null>>([]);
  const [band, setBand] = useState({
    top: CODE_PADDING + (first ?? 0) * LINE_HEIGHT,
    height: ((last ?? 0) - (first ?? 0) + 1) * LINE_HEIGHT,
  });
  // Bumped whenever the panel is resized, which re-wraps the lines.
  const [layoutVersion, setLayoutVersion] = useState(0);
  useEffect(() => {
    const panel = scroller.current;
    if (!panel || typeof ResizeObserver === 'undefined') return;
    let width = panel.clientWidth;
    const observer = new ResizeObserver(() => {
      if (panel.clientWidth === width) return;
      width = panel.clientWidth;
      setLayoutVersion((version) => version + 1);
    });
    observer.observe(panel);
    return () => observer.disconnect();
  }, []);
  // Keep the band where it was while no line is active, so it fades in place.
  useIsomorphicLayoutEffect(() => {
    if (first === null || last === null) return;
    const from = rows.current[first];
    const to = rows.current[last];
    if (!from || !to) return;
    const next = {
      top: CODE_PADDING + from.offsetTop,
      height: to.offsetTop + to.offsetHeight - from.offsetTop,
    };
    setBand((current) =>
      current.top === next.top && current.height === next.height
        ? current
        : next,
    );
  }, [first, last, layoutVersion]);
  // Scroll the panel itself (never the page) to keep the active lines in view.
  useEffect(() => {
    const panel = scroller.current;
    if (!panel || first === null) return;
    panel.scrollTo({
      top: Math.max(0, band.top + band.height / 2 - panel.clientHeight / 2),
      behavior: reduced ? 'auto' : 'smooth',
    });
  }, [band, first, reduced]);

  return (
    <div
      ref={scroller}
      data-code-panel
      className={`max-h-[126px] overflow-auto rounded-lg border border-line bg-canvas/70 sm:max-h-[172px] ${className} ${sceneFirst ? 'sm:!order-4' : ''}`}
    >
      <div className="relative sm:min-w-max" style={{ padding: CODE_PADDING }}>
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 border-l-2"
          style={{
            borderColor: tone('--color-warning'),
            background: tone('--color-warning', 0.1),
          }}
          initial={false}
          animate={{
            top: band.top,
            height: band.height,
            opacity: first === null ? 0 : 1,
          }}
          transition={reduced ? INSTANT : MOVE}
        />
        <ol className="relative font-mono text-[12px] leading-[22px] sm:leading-[26px]">
          {scene.code.lines.map((line, index) => (
            <li
              key={index}
              ref={(element) => {
                rows.current[index] = element;
              }}
              aria-current={highlighted.has(index) ? 'step' : undefined}
              className="flex min-h-[22px] items-start gap-3 pr-2 sm:min-h-[26px] sm:pr-4"
            >
              <span className="w-5 shrink-0 select-none text-right text-faint">
                {index + 1}
              </span>
              <code
                className={`min-w-0 whitespace-pre-wrap transition-colors duration-300 [overflow-wrap:anywhere] sm:whitespace-pre ${highlighted.has(index) ? 'text-ink' : 'text-subtle'}`}
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
  beside,
}: {
  checking: boolean;
  stackBusy: boolean;
  /** True when a stack already fills the neighbouring grid column. */
  beside: boolean;
}) {
  return (
    <div
      data-event-loop={checking ? 'checking' : 'idle'}
      className={`flex items-center gap-2 rounded-lg border px-2 py-2 transition-colors sm:gap-3 sm:px-3 ${beside ? '' : 'col-span-2 sm:col-span-1'} duration-300 ${checking ? 'border-line-strong bg-surface-raised text-ink' : 'border-line text-faint'}`}
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
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.08em] sm:text-[10px] sm:tracking-[0.18em]">
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
      <header className="px-2 pt-1.5 sm:px-3 sm:pt-2">
        <span
          className="font-mono text-xs font-semibold uppercase tracking-[0.08em] sm:text-[10px] sm:tracking-[0.18em]"
          style={{ color: tone(variable) }}
        >
          {region.label}
        </span>
      </header>
      <ol className="min-h-[28px] px-2 pb-2 pt-1 font-mono text-[12px] text-ink sm:px-3">
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
            <span className="min-w-0 [overflow-wrap:anywhere]">{line}</span>
          </motion.li>
        ))}
      </ol>
    </section>
  );
}

/**
 * The live operation with its real values, between the scene and the code.
 * Decorative: the narration is the accessible description of the step.
 */
function ActionCaption({
  action,
  reduced,
  sceneFirst,
}: {
  action: RuntimeSceneStep['action'];
  reduced: boolean;
  sceneFirst: boolean;
}) {
  const variable = ACTION_TONE_VAR[action?.tone ?? 'compare'];
  return (
    <div
      aria-hidden
      data-action={action?.tone ?? (action ? 'compare' : 'none')}
      className={`order-2 flex min-h-[2.25rem] items-center rounded-md border px-2.5 py-1.5 transition-colors duration-300 sm:order-3 ${sceneFirst ? 'sm:!order-2' : ''}`}
      style={{
        borderColor: action ? tone(variable, 0.45) : 'transparent',
        background: action ? tone(variable, 0.07) : 'transparent',
      }}
    >
      {action && (
        <motion.p
          key={action.text}
          initial={reduced ? false : { opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={reduced ? INSTANT : { duration: 0.25 }}
          className="min-w-0 font-mono text-[13px] font-semibold leading-5 [overflow-wrap:anywhere]"
          style={{ color: tone(variable) }}
        >
          {action.text}
        </motion.p>
      )}
    </div>
  );
}

/**
 * Marks the final step: a success outline over the scene plus one light sweep
 * across it. With reduced motion only the static outline is drawn.
 */
function CompletionSweep({ reduced }: { reduced: boolean }) {
  return (
    <div
      aria-hidden
      data-completion={reduced ? 'static' : 'sweep'}
      className="pointer-events-none absolute -inset-1 overflow-hidden rounded-xl border"
      style={{
        borderColor: tone('--color-success', 0.55),
        boxShadow: `0 0 0 3px ${tone('--color-success', 0.1)}`,
      }}
    >
      {!reduced && (
        <motion.div
          className="absolute inset-y-0 w-1/3"
          style={{
            background: `linear-gradient(90deg, transparent, ${tone('--color-success', 0.22)}, transparent)`,
          }}
          initial={{ left: '-35%' }}
          animate={{ left: '105%' }}
          transition={{ duration: 0.9, ease: 'easeInOut' }}
        />
      )}
    </div>
  );
}

export default function RuntimeSceneViz({
  scene,
  step,
  stepIndex,
  sceneFirst: sceneFirstProp,
}: {
  scene: RuntimeScene;
  step: RuntimeSceneStep;
  stepIndex: number;
  /**
   * Lead with the scene at every width (scene, caption, narration, code from
   * `sm` up) instead of only on phones. Defaults to on for array, grid, table
   * and plot scenes: the data is the lesson, and a tall region below the code
   * would fall out of the sticky desktop player.
   */
  sceneFirst?: boolean;
}) {
  const reduced = Boolean(useReducedMotion());
  const sceneFirst =
    sceneFirstProp ??
    scene.regions.some((region) =>
      ['array', 'grid', 'table', 'plot'].includes(region.kind),
    );
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
  const arrays = byKind('array');
  const grids = byKind('grid');
  const tables = byKind('table');
  const plots = byKind('plot');
  // A stack next to a grid is its frontier: the two share one row.
  const gridStacks = grids.length > 0 ? stacks : [];
  const freeStacks = grids.length > 0 ? [] : stacks;
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

  const isFinal = stepIndex === scene.steps.length - 1;
  const hasActions = scene.steps.some((item) => item.action);

  // The pipeline strip scrolls sideways on narrow screens: keep the station
  // the request is at centred. Only the strip scrolls, never the page.
  const strip = useRef<HTMLDivElement>(null);
  const station =
    pipeline.find(
      (region) => active.has(region.id) && tokensIn(region.id).length > 0,
    ) ??
    pipeline.find((region) => tokensIn(region.id).length > 0) ??
    pipeline.find((region) => active.has(region.id));
  const stationId = station?.id;
  useEffect(() => {
    const scroller = strip.current;
    if (!scroller || !stationId) return;
    if (scroller.scrollWidth <= scroller.clientWidth) return;
    const target = scroller.querySelector<HTMLElement>(
      `[data-region="${stationId}"]`,
    );
    if (!target) return;
    const box = target.getBoundingClientRect();
    const frame = scroller.getBoundingClientRect();
    scroller.scrollTo({
      left: Math.max(
        0,
        box.left -
          frame.left +
          scroller.scrollLeft -
          (scroller.clientWidth - box.width) / 2,
      ),
      behavior: reduced ? 'auto' : 'smooth',
    });
  }, [stationId, stepIndex, reduced]);

  return (
    <section
      className="border-y border-line bg-surface/40 py-3"
      data-viz="runtime-scene"
      data-complete={isFinal || undefined}
    >
      <header className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 px-1">
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-muted sm:text-[10px] sm:tracking-[0.26em]">
          runtime scene
        </p>
        <div className="flex flex-wrap items-center justify-end gap-1.5">
          {scene.complexity &&
            (['time', 'space'] as const).map((axis) => (
              <span
                key={axis}
                data-complexity={axis}
                className="rounded border border-line-strong px-1.5 py-0.5 font-mono text-xs text-ink-soft sm:text-[11px]"
              >
                <span className="text-subtle">{axis} </span>
                {scene.complexity![axis]}
              </span>
            ))}
          <span className="font-mono text-xs uppercase tracking-[0.12em] text-subtle sm:text-[10px] sm:tracking-[0.2em]">
            {scene.code.language}
          </span>
        </div>
      </header>
      {/* Phones lead with the scene, so the step title sits above it. The
          live region below carries the same text for assistive tech. */}
      <p
        aria-hidden
        className="mt-2 px-1 text-sm font-semibold leading-5 text-ink sm:hidden"
      >
        <span className="mr-2 font-mono text-xs font-normal text-subtle">
          {stepIndex + 1}/{scene.steps.length}
        </span>
        {step.label}
      </p>
      {/* Visual order: scene, caption, code, narration on phones (scene
          first); narration, code, caption, scene from `sm` up, unless the
          scene leads there too. */}
      <div className="mt-2 grid gap-2 sm:mt-3 sm:gap-3">
        <div
          aria-live="polite"
          className={`order-4 border-l-2 border-line-strong pl-3 sm:order-1 sm:min-h-[7rem] sm:pl-4 ${sceneFirst ? 'sm:!order-3' : ''}`}
        >
          <p className="hidden font-mono text-[10px] uppercase tracking-[0.2em] text-subtle sm:block">
            Step {stepIndex + 1} of {scene.steps.length}
          </p>
          <p className="sr-only text-sm font-semibold text-ink sm:not-sr-only sm:mt-1">
            {step.label}
          </p>
          <p className="text-sm leading-6 text-ink-soft sm:mt-1">
            {step.narration}
          </p>
        </div>
        <CodePanel
          scene={scene}
          step={step}
          reduced={reduced}
          sceneFirst={sceneFirst}
          className="order-3 sm:order-2"
        />
        {hasActions && (
          <ActionCaption
            action={
              step.action ??
              (isFinal ? { text: '✓ complete', tone: 'ok' } : undefined)
            }
            reduced={reduced}
            sceneFirst={sceneFirst}
          />
        )}
        <div
          data-scene
          className={`relative order-1 grid gap-2 sm:order-4 sm:gap-3 ${sceneFirst ? 'sm:!order-1' : ''}`}
        >
          <LayoutGroup id="runtime-scene">
            {pipeline.length > 0 && (
              <motion.div
                ref={strip}
                layoutScroll
                data-pipeline-scroller
                className="overflow-x-auto pb-1 sm:overflow-visible sm:pb-0"
              >
                <ol
                  data-pipeline
                  className="flex min-w-max items-stretch gap-1 sm:min-w-0"
                >
                  {pipeline.map((region, index) => (
                    <li
                      key={region.id}
                      className="flex min-w-[104px] flex-1 basis-0 items-stretch gap-1 sm:min-w-[84px]"
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
              </motion.div>
            )}
            {arrays.map((region) => {
              const view = step.arrays?.find(
                (item) => item.regionId === region.id,
              );
              return (
                view && (
                  <ArrayRegion
                    key={region.id}
                    region={region}
                    view={view}
                    active={active.has(region.id)}
                    reduced={reduced}
                  />
                )
              );
            })}
            {plots.map((region) => {
              const view = step.plots?.find(
                (item) => item.regionId === region.id,
              );
              return (
                view && (
                  <PlotRegion
                    key={region.id}
                    region={region}
                    view={view}
                    active={active.has(region.id)}
                    reduced={reduced}
                  />
                )
              );
            })}
            {tables.length > 0 && (
              <TableRegions
                regions={tables}
                views={step.tables ?? []}
                activeIds={active}
                reduced={reduced}
              />
            )}
            {grids.length > 0 && (
              <div
                className={`grid gap-2 sm:gap-3 ${gridStacks.length > 0 ? 'grid-cols-[minmax(0,1fr)_5.5rem] sm:grid-cols-[minmax(0,1fr)_8rem]' : ''}`}
              >
                {grids.map((region) => {
                  const view = step.grids?.find(
                    (item) => item.regionId === region.id,
                  );
                  return (
                    view && (
                      <GridRegion
                        key={region.id}
                        region={region}
                        view={view}
                        tokens={tokensIn(region.id)}
                        active={active.has(region.id)}
                        reduced={reduced}
                      />
                    )
                  );
                })}
                {gridStacks.map((region) => (
                  <Region key={region.id} {...regionProps(region)} />
                ))}
              </div>
            )}
            {(freeStacks.length > 0 || boxes.length > 0 || hasEventLoop) && (
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                {freeStacks.map((region) => (
                  <Region
                    key={region.id}
                    {...regionProps(region)}
                    className="[grid-row:span_var(--stack-rows)]"
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
                      freeStacks.length === 0 &&
                      !hasEventLoop &&
                      boxes.length % 2 === 1
                        ? 'col-span-2'
                        : ''
                    }
                  />
                ))}
                {hasEventLoop && (
                  <EventLoopIndicator
                    checking={step.eventLoop === 'checking' && !stackBusy}
                    stackBusy={stackBusy}
                    beside={freeStacks.length > 0}
                  />
                )}
              </div>
            )}
            {queues.length > 0 && (
              <div
                className={`grid gap-2 sm:gap-3 ${queues.length > 1 ? 'grid-cols-2' : ''}`}
              >
                {queues.map((region) => (
                  <Region
                    key={region.id}
                    {...regionProps(region)}
                    compact={queues.length > 1}
                  />
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
          {isFinal && <CompletionSweep key={stepIndex} reduced={reduced} />}
        </div>
      </div>
    </section>
  );
}
