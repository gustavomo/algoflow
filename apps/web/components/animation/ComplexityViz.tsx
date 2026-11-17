'use client';

import { useEffect, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import {
  COMPLEXITY_CLASSES,
  COMPLEXITY_N_MAX,
  COMPLEXITY_N_MIN,
  COMPLEXITY_OPS_MAX,
  chartX,
  chartY,
  clampN,
  complexityClass,
  curvePath,
  describeGrowth,
  nextGrowthStep,
  operationsAt,
  type ChartBox,
  type ComplexityId,
} from '../../lib/algorithms/complexityModel';
import { tone } from '../../lib/animation/runtimeSceneTone';

const VIEW = { width: 320, height: 208 };
const BOX: ChartBox = { left: 34, top: 14, width: 276, height: 164 };
const X_TICKS = [1, 16, 32, 48, 64];
const Y_TICKS = [0, 150, 300, 450];
const GROW_MS = 150;
const GROW_REDUCED_MS = 900;

const count = (value: number) => value.toLocaleString('en-US');

export default function ComplexityViz() {
  const reduced = Boolean(useReducedMotion());
  const [n, setN] = useState(8);
  const [selected, setSelected] = useState<ComplexityId>('linear');
  const [growing, setGrowing] = useState(false);
  const operations = operationsAt(n);
  const current = complexityClass(selected);
  const currentOps = operations[selected];
  const offChart = currentOps > COMPLEXITY_OPS_MAX;

  // Step mode: n grows on a timer until it reaches the maximum.
  useEffect(() => {
    if (!growing) return;
    const timer = setTimeout(
      () => {
        const next = nextGrowthStep(n, reduced);
        if (next === null) setGrowing(false);
        else setN(next);
      },
      reduced ? GROW_REDUCED_MS : GROW_MS,
    );
    return () => clearTimeout(timer);
  }, [growing, n, reduced]);

  const pick = (value: number) => {
    setGrowing(false);
    setN(clampN(value));
  };
  const cursorX = chartX(n, BOX);
  const markerY = chartY(currentOps, BOX);
  const labelLeft = cursorX > BOX.left + BOX.width * 0.6;

  return (
    <section
      className="border-y border-line bg-surface/40 py-3 sm:py-5"
      data-viz="complexity"
      data-n={n}
      data-selected={selected}
    >
      <header className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-1">
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-muted sm:text-[10px] sm:tracking-[0.26em]">
          Growth model
        </p>
        <p data-ops-readout className="font-mono text-sm text-ink">
          <span className="text-subtle">n = </span>
          {n}
          <span className="text-subtle"> · {current.label} = </span>
          {count(currentOps)}
          <span className="text-subtle">
            {' '}
            {currentOps === 1 ? 'step' : 'steps'}
          </span>
        </p>
      </header>

      <svg
        viewBox={`0 0 ${VIEW.width} ${VIEW.height}`}
        className="mt-2 block h-auto w-full"
        role="img"
        aria-label={`Operations against input size n, from ${COMPLEXITY_N_MIN} to ${COMPLEXITY_N_MAX}. ${describeGrowth(selected, n)}`}
      >
        {Y_TICKS.map((tick) => (
          <g key={tick}>
            <line
              x1={BOX.left}
              x2={BOX.left + BOX.width}
              y1={chartY(tick, BOX)}
              y2={chartY(tick, BOX)}
              stroke={tone(tick === 0 ? '--color-line-strong' : '--color-line')}
              strokeWidth="1"
            />
            <text
              x={BOX.left - 5}
              y={chartY(tick, BOX) + 3.5}
              textAnchor="end"
              fill={tone('--color-subtle')}
              fontSize="10"
              fontFamily="ui-monospace, monospace"
            >
              {tick}
            </text>
          </g>
        ))}
        {X_TICKS.map((tick) => (
          <text
            key={tick}
            x={chartX(tick, BOX)}
            y={BOX.top + BOX.height + 13}
            textAnchor="middle"
            fill={tone('--color-subtle')}
            fontSize="10"
            fontFamily="ui-monospace, monospace"
          >
            {tick}
          </text>
        ))}
        <text
          x={BOX.left + BOX.width}
          y={VIEW.height - 3}
          textAnchor="end"
          fill={tone('--color-faint')}
          fontSize="10"
        >
          input size n →
        </text>
        <text x={BOX.left} y={9} fill={tone('--color-faint')} fontSize="10">
          ↑ steps
        </text>
        <line
          data-cursor
          x1={cursorX}
          x2={cursorX}
          y1={BOX.top}
          y2={BOX.top + BOX.height}
          stroke={tone('--color-line-strong')}
          strokeWidth="1"
          strokeDasharray="2 3"
        />
        {/* Unselected curves stay recessive and are told apart by their dash
            pattern; only the selected one takes a colour. */}
        {COMPLEXITY_CLASSES.map((item) => {
          const isSelected = item.id === selected;
          return (
            <path
              key={item.id}
              data-curve={item.id}
              d={curvePath(item, BOX)}
              fill="none"
              stroke={tone(isSelected ? item.tone : '--color-muted')}
              strokeOpacity={isSelected ? 1 : 0.55}
              strokeWidth={isSelected ? 2.5 : 1.25}
              strokeDasharray={item.dash}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-[stroke,stroke-opacity,stroke-width] duration-300"
            />
          );
        })}
        {COMPLEXITY_CLASSES.map((item) => {
          const isSelected = item.id === selected;
          return (
            <circle
              key={item.id}
              data-marker={item.id}
              cx={cursorX}
              cy={chartY(operations[item.id], BOX)}
              r={isSelected ? 4.5 : 2.5}
              fill={tone(isSelected ? item.tone : '--color-muted')}
              stroke={tone('--color-canvas')}
              strokeWidth={isSelected ? 2 : 1}
            />
          );
        })}
        <text
          data-marker-label
          x={cursorX + (labelLeft ? -9 : 9)}
          y={Math.max(BOX.top + 10, markerY - 8)}
          textAnchor={labelLeft ? 'end' : 'start'}
          fill={tone('--color-ink')}
          stroke={tone('--color-canvas')}
          strokeWidth="3"
          paintOrder="stroke"
          fontSize="11"
          fontWeight="600"
          fontFamily="ui-monospace, monospace"
        >
          {offChart ? '↑ ' : ''}
          {count(currentOps)}
          {offChart ? ' · off the chart' : ''}
        </text>
      </svg>

      <label className="mt-2 flex items-center gap-3 px-1 text-xs text-subtle">
        <span className="shrink-0 font-mono">n</span>
        <input
          type="range"
          aria-label="Input size n"
          aria-valuetext={`n = ${n}: ${current.label} takes ${count(currentOps)} steps`}
          min={COMPLEXITY_N_MIN}
          max={COMPLEXITY_N_MAX}
          step={1}
          value={n}
          onChange={(event) => pick(Number(event.target.value))}
          className="h-11 min-w-0 flex-1 cursor-pointer touch-pan-y accent-action"
        />
        <output className="w-8 shrink-0 text-right font-mono text-sm text-ink">
          {n}
        </output>
      </label>
      <div className="flex flex-wrap items-center gap-2 px-1" data-step-mode>
        <button
          type="button"
          onClick={() => {
            if (!growing && n >= COMPLEXITY_N_MAX) setN(COMPLEXITY_N_MIN);
            setGrowing(!growing);
          }}
          aria-pressed={growing}
          className="min-h-11 min-w-28 bg-action px-4 py-2 text-sm font-semibold text-canvas"
        >
          {growing ? 'Pause' : 'Grow n'}
        </button>
        <button
          type="button"
          onClick={() => pick(n * 2)}
          disabled={n >= COMPLEXITY_N_MAX}
          aria-label="Double n"
          className="min-h-11 min-w-11 border border-line px-3 py-2 font-mono text-sm disabled:opacity-30"
        >
          ×2
        </button>
        <button
          type="button"
          onClick={() => pick(COMPLEXITY_N_MIN)}
          disabled={n === COMPLEXITY_N_MIN && !growing}
          className="min-h-11 border border-line px-3 py-2 text-sm disabled:opacity-30"
        >
          Reset
        </button>
      </div>

      <div
        role="radiogroup"
        aria-label="Complexity class"
        data-counters
        className="mt-3 grid grid-cols-3 gap-1.5 sm:grid-cols-5"
      >
        {COMPLEXITY_CLASSES.map((item) => {
          const isSelected = item.id === selected;
          return (
            <button
              key={item.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              data-counter={item.id}
              onClick={() => setSelected(item.id)}
              className={`min-h-11 rounded-lg border px-2 py-1.5 text-left transition-colors duration-300 ${isSelected ? 'bg-surface-raised' : 'border-line hover:border-line-strong'}`}
              style={isSelected ? { borderColor: tone(item.tone) } : undefined}
            >
              <span className="flex items-center gap-1.5">
                <svg aria-hidden viewBox="0 0 18 4" className="h-1 w-[18px]">
                  <line
                    x1="1"
                    x2="17"
                    y1="2"
                    y2="2"
                    stroke={tone(isSelected ? item.tone : '--color-muted')}
                    strokeWidth="2"
                    strokeDasharray={item.dash
                      ?.split(' ')
                      .map((part) => Number(part) / 3)
                      .join(' ')}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="whitespace-nowrap font-mono text-xs text-ink-soft">
                  {item.label}
                </span>
              </span>
              <span className="mt-0.5 block font-mono text-sm font-semibold tabular-nums text-ink">
                {count(operations[item.id])}
              </span>
            </button>
          );
        })}
      </div>

      <p
        data-growth
        className="mt-3 border-l-2 border-line-strong px-1 pl-3 text-sm leading-6 text-ink-soft sm:min-h-[4.5rem]"
      >
        {describeGrowth(selected, n)}
      </p>

      <figure className="mt-3" data-code-class={selected}>
        <figcaption className="px-1 font-mono text-xs text-subtle">
          {current.label} · {current.name} · javascript
        </figcaption>
        <ol className="mt-1.5 overflow-x-auto rounded-lg border border-line bg-canvas/70 py-2 font-mono text-[12px] leading-[22px]">
          {current.code.map((line, index) => {
            const hot = index === current.hotLine;
            return (
              <li
                key={index}
                aria-current={hot ? 'step' : undefined}
                className="flex items-start gap-3 border-l-2 px-2"
                style={{
                  borderColor: hot ? tone(current.tone) : 'transparent',
                  background: hot ? tone(current.tone, 0.1) : 'transparent',
                }}
              >
                <span className="w-4 shrink-0 select-none text-right text-faint">
                  {index + 1}
                </span>
                <code
                  className={`min-w-0 whitespace-pre-wrap [overflow-wrap:anywhere] ${hot ? 'text-ink' : 'text-subtle'}`}
                >
                  {line}
                  {hot && (
                    <span data-hot-count className="text-ink-soft">
                      {'  '}
                      {`// runs ${count(currentOps)}× at n = ${n}`}
                    </span>
                  )}
                </code>
              </li>
            );
          })}
        </ol>
      </figure>
    </section>
  );
}
