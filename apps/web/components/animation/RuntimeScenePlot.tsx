'use client';

import { motion } from 'framer-motion';
import type {
  RuntimeScenePlotView,
  RuntimeSceneRegion,
} from '@algoflow/contracts';
import { INSTANT, MOVE } from '../../lib/animation/runtimeSceneMotion';
import {
  PLOT_ORIGIN,
  PLOT_SIDE,
  plotAngle,
  plotArcPath,
  plotLabelOffset,
  plotProject,
} from '../../lib/animation/runtimeSceneGeometry';
import {
  CELL_STATE_VAR,
  TONE_VAR,
  tone,
} from '../../lib/animation/runtimeSceneTone';

const ANGLE_RADIUS = 15;

/** A dot with its label, placed in percent so it glides when it moves. */
function Mark({
  id,
  label,
  x,
  y,
  colour,
  strong,
  dimmed,
  transition,
}: {
  id: string;
  label: string;
  x: number;
  y: number;
  colour: string;
  strong: boolean;
  dimmed: boolean;
  transition: typeof MOVE;
}) {
  const at = plotProject(x, y);
  const offset = plotLabelOffset(x, y, label);
  return (
    <motion.div
      data-plot-point={id}
      className="absolute h-0 w-0"
      initial={false}
      animate={{ left: `${at.x}%`, top: `${at.y}%`, opacity: dimmed ? 0.5 : 1 }}
      transition={transition}
    >
      <span
        className="absolute -left-[5px] -top-[5px] block h-2.5 w-2.5 rounded-full border transition-colors duration-300"
        style={{
          background: colour,
          borderColor: tone('--color-canvas'),
          boxShadow: strong
            ? `0 0 0 3px ${tone('--color-canvas', 0.6)}`
            : 'none',
        }}
      />
      <span
        className={`absolute whitespace-nowrap rounded px-1 font-mono text-xs leading-4 transition-colors duration-300 ${strong ? 'font-semibold' : ''}`}
        style={{
          transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
          color: strong ? colour : tone('--color-ink-soft'),
          background: tone('--color-canvas', 0.72),
        }}
      >
        {label}
      </span>
    </motion.div>
  );
}

export function PlotRegion({
  region,
  view,
  active,
  reduced,
}: {
  region: RuntimeSceneRegion;
  view: RuntimeScenePlotView;
  active: boolean;
  reduced: boolean;
}) {
  const variable = TONE_VAR[region.tone];
  const transition = reduced ? INSTANT : MOVE;
  const neighbours = new Set(view.neighbours ?? []);
  const query = view.query;
  const queryAt = query ? plotProject(query.x, query.y) : null;
  const anglePoint = view.angle
    ? view.points.find((point) => point.id === view.angle!.pointId)
    : undefined;
  const pointColour = (state: (typeof view.points)[number]['state']) => {
    const stateVar = state ? CELL_STATE_VAR[state] : null;
    return stateVar
      ? tone(stateVar)
      : state === 'visited'
        ? tone('--color-faint')
        : tone(variable);
  };
  const description = [
    ...view.points.map(
      (point) =>
        `${point.label} at ${point.x.toFixed(2)}, ${point.y.toFixed(2)}`,
    ),
    ...(query ? [`query ${query.label}`] : []),
    ...(view.neighbours?.length
      ? [`nearest: ${view.neighbours.join(', ')}`]
      : []),
  ].join('; ');
  return (
    <section
      aria-label={region.label}
      data-region={region.id}
      data-plot
      data-active={active || undefined}
      className="min-w-0 rounded-lg border transition-[border-color,background-color] duration-300"
      style={{
        borderColor: tone(variable, active ? 0.75 : 0.28),
        background: tone(variable, 0.025),
      }}
    >
      <header className="flex items-center justify-between gap-2 px-2 pt-1.5 sm:px-3 sm:pt-2">
        <span
          className="font-mono text-xs font-semibold uppercase tracking-[0.08em] sm:text-[10px] sm:tracking-[0.18em]"
          style={{ color: tone(variable) }}
        >
          {region.label}
        </span>
        {view.angle && anglePoint && query && (
          <span
            data-plot-angle
            className="whitespace-nowrap font-mono text-xs text-ink"
          >
            ∠ {query.label}, {anglePoint.label} ={' '}
            {Math.round(
              Math.abs(
                plotAngle(query.x, query.y) -
                  plotAngle(anglePoint.x, anglePoint.y),
              ),
            )}
            ° · {view.angle.label}
          </span>
        )}
      </header>
      <div
        role="img"
        aria-label={`${region.label}: ${description}`}
        className="relative mx-auto aspect-square w-full max-w-[21rem]"
      >
        <svg
          aria-hidden
          viewBox="0 0 100 100"
          className="absolute inset-0 h-full w-full"
        >
          <path
            d={`M ${PLOT_ORIGIN.x} ${PLOT_ORIGIN.y - PLOT_SIDE - 6} V ${PLOT_ORIGIN.y} H ${PLOT_ORIGIN.x + PLOT_SIDE + 6}`}
            fill="none"
            stroke={tone('--color-line-strong')}
            strokeWidth="0.5"
          />
          <motion.path
            data-unit-arc
            d={`M ${PLOT_ORIGIN.x + PLOT_SIDE} ${PLOT_ORIGIN.y} A ${PLOT_SIDE} ${PLOT_SIDE} 0 0 0 ${PLOT_ORIGIN.x} ${PLOT_ORIGIN.y - PLOT_SIDE}`}
            fill="none"
            stroke={tone('--color-line-strong')}
            strokeWidth="0.5"
            strokeDasharray="1.5 1.5"
            initial={false}
            animate={{ opacity: view.unitArc ? 1 : 0 }}
            transition={transition}
          />
          {view.points.map((point) => {
            const at = plotProject(point.x, point.y);
            const drawn = Boolean(point.vector || anglePoint?.id === point.id);
            return (
              <motion.line
                key={`vector-${point.id}`}
                data-plot-vector={drawn ? point.id : undefined}
                x1={PLOT_ORIGIN.x}
                y1={PLOT_ORIGIN.y}
                stroke={pointColour(point.state)}
                strokeWidth="0.9"
                strokeLinecap="round"
                initial={false}
                animate={{ x2: at.x, y2: at.y, opacity: drawn ? 0.9 : 0 }}
                transition={transition}
              />
            );
          })}
          {queryAt &&
            view.points.map((point) => {
              const at = plotProject(point.x, point.y);
              const near = neighbours.has(point.id);
              return (
                <motion.line
                  key={`near-${point.id}`}
                  data-plot-neighbour={near ? point.id : undefined}
                  stroke={tone('--color-success')}
                  strokeWidth="0.8"
                  strokeDasharray="1.6 1.4"
                  initial={false}
                  animate={{
                    x1: queryAt.x,
                    y1: queryAt.y,
                    x2: at.x,
                    y2: at.y,
                    opacity: near ? 1 : 0,
                  }}
                  transition={transition}
                />
              );
            })}
          {queryAt && (
            <motion.line
              data-plot-query
              x1={PLOT_ORIGIN.x}
              y1={PLOT_ORIGIN.y}
              stroke={tone('--color-ink')}
              strokeWidth="1.1"
              strokeLinecap="round"
              initial={false}
              animate={{ x2: queryAt.x, y2: queryAt.y }}
              transition={transition}
            />
          )}
          {query && anglePoint && (
            <path
              data-plot-arc
              d={plotArcPath(query, anglePoint, ANGLE_RADIUS)}
              fill="none"
              stroke={pointColour(anglePoint.state)}
              strokeWidth="1"
            />
          )}
        </svg>
        {view.points.map((point) => (
          <Mark
            key={point.id}
            id={point.id}
            label={point.label}
            x={point.x}
            y={point.y}
            colour={pointColour(point.state)}
            strong={
              Boolean(point.state && CELL_STATE_VAR[point.state]) ||
              neighbours.has(point.id)
            }
            dimmed={point.state === 'visited'}
            transition={transition}
          />
        ))}
        {query && (
          <Mark
            id="query"
            label={query.label}
            x={query.x}
            y={query.y}
            colour={tone('--color-ink')}
            strong
            dimmed={false}
            transition={transition}
          />
        )}
        {view.axes && (
          <>
            <span className="absolute bottom-0.5 right-2 font-mono text-[11px] text-faint">
              {view.axes.x} →
            </span>
            <span className="absolute left-1 top-1 font-mono text-[11px] text-faint">
              ↑ {view.axes.y}
            </span>
          </>
        )}
      </div>
    </section>
  );
}
