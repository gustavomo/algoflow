'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import type {
  RuntimeSceneArrayView,
  RuntimeSceneCellState,
  RuntimeSceneGridView,
  RuntimeSceneRegion,
  RuntimeSceneToken,
} from '@algoflow/contracts';
import { INSTANT, MOVE } from '../../lib/animation/runtimeSceneMotion';
import {
  CELL_STATE_VAR,
  TONE_VAR,
  cellCentrePercent,
  comparatorSpan,
  isLifted,
  spanPercent,
  tone,
} from '../../lib/animation/runtimeSceneTone';

/** How far, in px, the comparator raises the cells it holds. */
const LIFT = 14;
/** Delay between two consecutive cells of the final path lighting up. */
const PATH_STEP_MS = 55;

const HEADER_CLASS =
  'font-mono text-xs font-semibold uppercase tracking-[0.08em] sm:text-[10px] sm:tracking-[0.18em]';

function cellColours(state: RuntimeSceneCellState) {
  const variable = CELL_STATE_VAR[state];
  if (variable)
    return {
      borderColor: tone(variable, 0.85),
      background: tone(variable, state === 'path' ? 0.26 : 0.16),
      color: tone('--color-ink'),
    };
  if (state === 'visited')
    return {
      borderColor: tone('--color-line'),
      background: tone('--color-surface-raised'),
      color: tone('--color-faint'),
    };
  return {
    borderColor: tone('--color-line-strong'),
    background: tone('--color-surface'),
    color: tone('--color-ink'),
  };
}

/**
 * One array value. Memoised and keyed by its stable id, so a step re-renders
 * only the cells whose state changed, and a cell whose position changed glides
 * there through its layoutId instead of being redrawn.
 */
const ArrayCell = memo(function ArrayCell({
  layoutId,
  label,
  state,
  weight,
  reduced,
}: {
  layoutId: string;
  label: string;
  state: RuntimeSceneCellState;
  weight?: number;
  reduced: boolean;
}) {
  const lifted = isLifted(state);
  const variable = CELL_STATE_VAR[state];
  return (
    <motion.div
      layoutId={layoutId}
      layout="position"
      data-array-cell={state}
      initial={false}
      animate={{ y: lifted ? -LIFT : 0, scale: lifted ? 1.06 : 1 }}
      transition={reduced ? INSTANT : MOVE}
      className="relative px-0.5"
      style={{ zIndex: lifted ? 2 : 1 }}
    >
      <div
        className="flex min-h-[44px] flex-col items-center justify-center rounded-md border font-mono text-sm font-semibold transition-[background-color,border-color,color,box-shadow] duration-300 sm:min-h-[52px] sm:text-base"
        style={{
          ...cellColours(state),
          boxShadow:
            lifted && variable
              ? `0 12px 16px -6px ${tone('--color-canvas', 0.95)}, 0 0 0 2px ${tone(variable, 0.3)}`
              : 'none',
        }}
      >
        {label}
        {weight !== undefined && (
          <span
            aria-hidden
            className="mt-1 block h-1 rounded-full transition-colors duration-300"
            style={{
              width: `${18 + weight * 64}%`,
              background: tone(variable ?? '--color-line-strong', 0.85),
            }}
          />
        )}
      </div>
    </motion.div>
  );
});

export function ArrayRegion({
  region,
  view,
  active,
  reduced,
}: {
  region: RuntimeSceneRegion;
  view: RuntimeSceneArrayView;
  active: boolean;
  reduced: boolean;
}) {
  const variable = TONE_VAR[region.tone];
  const count = view.cells.length;
  const columns = { gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` };
  const span = comparatorSpan(view.cells.map((cell) => cell.state));
  const comparatorVar = span?.swapping
    ? '--color-scene-orange'
    : '--color-warning';
  const transition = reduced ? INSTANT : MOVE;
  return (
    <section
      aria-label={region.label}
      data-region={region.id}
      data-array
      data-active={active || undefined}
      className="min-w-0 rounded-lg border transition-[border-color,background-color] duration-300"
      style={{
        borderColor: tone(variable, active ? 0.6 : 0.28),
        background: tone(variable, 0.025),
      }}
    >
      <header className="flex items-center justify-between gap-2 px-2 pt-1.5 sm:px-3 sm:pt-2">
        <span className={HEADER_CLASS} style={{ color: tone(variable) }}>
          {region.label}
        </span>
        {view.range?.label && (
          <span
            data-range-label
            className="whitespace-nowrap font-mono text-[11px] uppercase tracking-[0.06em] text-subtle sm:text-[10px] sm:tracking-[0.14em]"
          >
            <span
              aria-hidden
              className="mr-1.5 inline-block h-2 w-3 rounded-sm border align-middle"
              style={{
                borderColor: tone(variable, 0.9),
                background: tone(variable, 0.18),
              }}
            />
            {view.range.label} [{view.range.from}..{view.range.to}]
          </span>
        )}
      </header>
      {/* Top padding leaves room for the lifted pair. */}
      <div className="px-1.5 pb-1.5 pt-5 sm:px-2.5 sm:pb-2 sm:pt-6">
        <div
          role="img"
          aria-label={`${region.label}: ${view.cells.map((cell) => cell.label).join(', ')}`}
          className="relative grid"
          style={columns}
        >
          <motion.div
            aria-hidden
            data-range
            className="pointer-events-none absolute -inset-y-1 rounded-lg border"
            style={{
              borderColor: tone(variable, 0.7),
              background: tone(variable, 0.09),
            }}
            initial={false}
            animate={{
              ...(view.range
                ? spanPercent(view.range.from, view.range.to, count)
                : {}),
              opacity: view.range ? 1 : 0,
            }}
            transition={transition}
          />
          {view.cells.map((cell) => (
            <ArrayCell
              key={cell.id}
              layoutId={`${region.id}:${cell.id}`}
              label={cell.label}
              state={cell.state ?? 'default'}
              weight={cell.weight}
              reduced={reduced}
            />
          ))}
          {/* The comparator: a tray that carries the compared pair upward. */}
          <motion.div
            aria-hidden
            data-comparator={
              span ? (span.swapping ? 'swap' : 'compare') : 'idle'
            }
            className="pointer-events-none absolute -bottom-2 h-2.5 rounded-b-md border-x-2 border-b-2"
            style={{ borderColor: tone(comparatorVar), zIndex: 3 }}
            initial={false}
            animate={{
              ...(span ? spanPercent(span.from, span.to, count) : {}),
              y: span ? -LIFT : 0,
              opacity: span ? 1 : 0,
            }}
            transition={transition}
          />
        </div>
        <div
          aria-hidden
          className="mt-2.5 grid font-mono text-[10px] text-faint"
          style={columns}
        >
          {view.cells.map((cell, index) => (
            <span key={cell.id} className="text-center">
              {index}
            </span>
          ))}
        </div>
        {view.pointers && (
          <div
            aria-hidden
            data-pointers
            className="grid min-h-[2.25rem] items-start"
            style={columns}
          >
            {view.cells.map((cell, index) => (
              <div key={index} className="flex flex-col items-center">
                {view
                  .pointers!.filter((pointer) => pointer.index === index)
                  .map((pointer) => (
                    <motion.span
                      key={pointer.label}
                      layoutId={`${region.id}:pointer:${pointer.label}`}
                      layout="position"
                      data-pointer={pointer.label}
                      transition={transition}
                      className="flex flex-col items-center font-mono text-[11px] font-semibold leading-[1.1] text-ink"
                    >
                      <span className="text-[9px] text-subtle">▲</span>
                      {pointer.label}
                    </motion.span>
                  ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/** Explored grid cells settle into a muted tint, apart from untouched ones. */
const VISITED_GRID_CELL = {
  borderColor: tone('--color-scene-teal', 0.4),
  background: tone('--color-scene-teal', 0.14),
  color: tone('--color-muted'),
};

/**
 * One grid cell: a plain element coloured through CSS transitions. Only the
 * single cell being visited carries a layoutId token, so stepping a whole
 * grid never asks the layout engine to track every cell.
 */
const GridCell = memo(function GridCell({
  cellId,
  state,
  wall,
  marker,
  tokenId,
  tokenLabel,
  pathOrder,
  reduced,
}: {
  cellId: string;
  state: RuntimeSceneCellState;
  wall: boolean;
  marker?: 'S' | 'G';
  tokenId?: string;
  tokenLabel?: string;
  /** Position along the final path, which sets when this cell lights up. */
  pathOrder: number;
  reduced: boolean;
}) {
  return (
    <div className="aspect-square p-0.5">
      <div
        data-grid-cell={cellId}
        data-cell-state={wall ? 'wall' : state}
        className={`relative flex h-full w-full items-center justify-center rounded border font-mono text-[10px] font-semibold transition-[background-color,border-color,color] duration-300 sm:text-[11px] ${state === 'frontier' ? 'scene-frontier' : ''}`}
        style={
          wall
            ? {
                borderColor: 'transparent',
                background: tone('--color-line-strong', 0.7),
              }
            : {
                ...(state === 'visited'
                  ? VISITED_GRID_CELL
                  : cellColours(state)),
                borderStyle: marker === 'G' ? 'dashed' : 'solid',
                transitionDelay:
                  state === 'path' && !reduced
                    ? `${pathOrder * PATH_STEP_MS}ms`
                    : '0ms',
              }
        }
      >
        {marker}
        {tokenId && (
          <motion.div
            layoutId={tokenId}
            layout="position"
            data-token={tokenId}
            transition={reduced ? INSTANT : MOVE}
            className="absolute inset-0 flex items-center justify-center rounded border"
            style={{
              borderColor: tone('--color-warning'),
              background: tone('--color-warning-muted'),
              color: tone('--color-ink'),
            }}
          >
            {tokenLabel}
          </motion.div>
        )}
      </div>
    </div>
  );
});

export function GridRegion({
  region,
  view,
  tokens,
  active,
  reduced,
}: {
  region: RuntimeSceneRegion;
  view: RuntimeSceneGridView;
  /** Tokens whose home is this grid: each is drawn inside its cell. */
  tokens: RuntimeSceneToken[];
  active: boolean;
  reduced: boolean;
}) {
  const layout = region.grid;
  if (!layout) return null;
  const variable = TONE_VAR[region.tone];
  const walls = new Set(layout.walls);
  const tokenAt = new Map(
    tokens.flatMap((token) =>
      token.cell ? [[token.cell.index, token] as const] : [],
    ),
  );
  const path = view.path ?? [];
  const pathOrder = new Map(path.map((cell, order) => [cell, order]));
  const centres = path.map((cell) =>
    cellCentrePercent(cell, layout.rows, layout.cols),
  );
  return (
    <section
      aria-label={region.label}
      data-region={region.id}
      data-grid
      data-active={active || undefined}
      className="min-w-0 rounded-lg border transition-[border-color,background-color] duration-300"
      style={{
        borderColor: tone(variable, active ? 0.6 : 0.28),
        background: tone(variable, 0.025),
      }}
    >
      <header className="flex items-center justify-between gap-2 px-2 pt-1.5 sm:px-3 sm:pt-2">
        <span className={HEADER_CLASS} style={{ color: tone(variable) }}>
          {region.label}
        </span>
        <span className="whitespace-nowrap font-mono text-[11px] uppercase tracking-[0.06em] text-faint sm:text-[9px] sm:tracking-[0.14em]">
          S start · G goal
        </span>
      </header>
      <div className="p-1.5 sm:p-2">
        <div
          role="img"
          aria-label={`${layout.rows} by ${layout.cols} grid with ${layout.walls.length} walls`}
          className="relative mx-auto grid w-full max-w-[17rem] sm:max-w-[18rem]"
          style={{
            gridTemplateColumns: `repeat(${layout.cols}, minmax(0, 1fr))`,
          }}
        >
          {view.cells.map((state, index) => {
            const token = tokenAt.get(index);
            return (
              <GridCell
                key={index}
                cellId={`${region.id}:${index}`}
                state={state}
                wall={walls.has(index)}
                marker={
                  index === layout.start
                    ? 'S'
                    : index === layout.goal
                      ? 'G'
                      : undefined
                }
                tokenId={token?.id}
                tokenLabel={token?.label}
                pathOrder={pathOrder.get(index) ?? 0}
                reduced={reduced}
              />
            );
          })}
          {/* The found route is traced by one highlight travelling along it. */}
          {path.length > 1 && !reduced && (
            <motion.div
              key={path.join('-')}
              aria-hidden
              data-path-traveller
              className="pointer-events-none absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{
                background: tone('--color-success'),
                boxShadow: `0 0 0 4px ${tone('--color-success', 0.25)}`,
              }}
              initial={{ ...centres[0], opacity: 1 }}
              animate={{
                left: centres.map((centre) => centre.left),
                top: centres.map((centre) => centre.top),
                opacity: [...centres.slice(1).map(() => 1), 0],
              }}
              transition={{
                duration: (path.length * PATH_STEP_MS) / 1000 + 0.2,
                ease: 'linear',
              }}
            />
          )}
        </div>
      </div>
    </section>
  );
}
