'use client';

import { motion, useReducedMotion } from 'framer-motion';
import type { ComplexitySnapshot } from '../../lib/algorithms/complexitySteps';

const curves = [
  {
    id: 'constant' as const,
    label: 'O(1)',
    dash: '3 7',
    d: 'M42 202 C190 202 350 202 590 202',
  },
  {
    id: 'linear' as const,
    label: 'O(n)',
    dash: '10 6',
    d: 'M42 202 L590 58',
  },
  {
    id: 'quadratic' as const,
    label: 'O(n²)',
    d: 'M42 202 C280 198 465 142 590 22',
  },
];

export default function ComplexityViz({
  snapshot,
}: {
  snapshot: ComplexitySnapshot;
}) {
  const reduced = useReducedMotion();
  const visible = new Set(snapshot.visibleCurves);
  return (
    <section className="border-y border-line bg-surface/40 py-6">
      <div className="flex flex-wrap items-end justify-between gap-4 px-1">
        <div>
          <p className="eyebrow">Growth model · input size n</p>
          <p className="mt-2 font-mono text-sm text-ink">
            n = {snapshot.inputSize.toLocaleString()}
          </p>
        </div>
        <span
          className={`font-mono text-[10px] uppercase tracking-[0.2em] ${snapshot.phase === 'failure' ? 'text-danger' : snapshot.phase === 'terminal' ? 'text-success' : 'text-warning'}`}
        >
          {snapshot.phase}
        </span>
      </div>
      <svg
        viewBox="0 0 640 250"
        className="mt-4 w-full"
        role="img"
        aria-label={`${snapshot.phase}: ${snapshot.narration}`}
      >
        <line x1="42" y1="215" x2="610" y2="215" stroke="#57534e" />
        <line x1="42" y1="16" x2="42" y2="215" stroke="#57534e" />
        {[80, 140, 200].map((y) => (
          <line
            key={y}
            x1="42"
            x2="610"
            y1={y}
            y2={y}
            stroke="#292524"
            strokeDasharray="3 8"
          />
        ))}
        {curves.map((curve, index) => {
          const shown = visible.has(curve.id);
          const failed =
            snapshot.phase === 'failure' && curve.id === 'quadratic';
          return (
            <g key={curve.id}>
              <motion.path
                d={curve.d}
                fill="none"
                stroke={failed ? '#fda4af' : shown ? '#fafaf9' : '#57534e'}
                strokeDasharray={curve.dash}
                strokeWidth={shown ? 3 : 1.5}
                initial={reduced ? false : { pathLength: 0 }}
                animate={{
                  pathLength: shown ? 1 : 0.12,
                  opacity: shown ? 1 : 0.2,
                }}
                transition={{ duration: reduced ? 0.01 : 0.5 }}
              />
              <text
                x="548"
                y={index === 0 ? 195 : index === 1 ? 70 : 24}
                fill={failed ? '#fda4af' : shown ? '#fafaf9' : '#57534e'}
                fontFamily="ui-monospace, monospace"
                fontSize="13"
              >
                {curve.label}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="grid grid-cols-3 border-y border-line py-3 text-center font-mono text-[9px] uppercase tracking-wider text-subtle sm:text-[10px]">
        <span>O(1) · {snapshot.operations.constant.toLocaleString()}</span>
        <span>O(n) · {snapshot.operations.linear.toLocaleString()}</span>
        <span>O(n²) · {snapshot.operations.quadratic.toLocaleString()}</span>
      </div>
      <p className="min-h-14 px-1 pt-4 text-sm leading-6 text-muted">
        {snapshot.narration}
      </p>
    </section>
  );
}
