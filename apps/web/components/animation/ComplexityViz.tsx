'use client';

import { motion, useReducedMotion } from 'framer-motion';

const curves = [
  {
    label: 'O(1)',
    color: '#78716c',
    dash: '3 7',
    d: 'M40 190 C180 190 330 190 520 190',
  },
  { label: 'O(n)', color: '#d6d3d1', dash: '10 6', d: 'M40 190 L520 55' },
  {
    label: 'O(n²)',
    color: '#fafaf9',
    dash: undefined,
    d: 'M40 190 C240 188 390 145 520 28',
  },
];

export default function ComplexityViz({ step }: { step: number }) {
  const reduced = useReducedMotion();
  return (
    <div className="rounded-[1.75rem] border border-line bg-surface p-6">
      <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-soft">
        Growth model · input size n
      </div>
      <svg
        viewBox="0 0 560 230"
        className="mt-5 w-full"
        role="img"
        aria-label="Complexity growth curves"
      >
        <line
          x1="40"
          y1="200"
          x2="535"
          y2="200"
          stroke="#78716c"
          strokeOpacity=".35"
        />
        <line
          x1="40"
          y1="20"
          x2="40"
          y2="200"
          stroke="#78716c"
          strokeOpacity=".35"
        />
        {curves.map((curve, index) => (
          <g key={curve.label}>
            <motion.path
              d={curve.d}
              fill="none"
              stroke={curve.color}
              strokeDasharray={curve.dash}
              strokeWidth="3"
              initial={reduced ? false : { pathLength: 0, opacity: 0 }}
              animate={{
                pathLength: step >= index ? 1 : 0.15,
                opacity: step >= index ? 1 : 0.2,
              }}
              transition={{ duration: reduced ? 0.01 : 0.5 }}
            />
            <text
              x={485}
              y={index === 0 ? 183 : index === 1 ? 75 : 25}
              fill={curve.color}
              fontFamily="ui-monospace, monospace"
              fontSize="13"
            >
              {curve.label}
            </text>
          </g>
        ))}
      </svg>
      <p className="mt-3 text-sm text-muted">
        {
          [
            'Constant work stays flat.',
            'Linear work grows with each input item.',
            'Quadratic work accelerates as pair combinations grow.',
          ][Math.min(step, 2)]
        }
      </p>
    </div>
  );
}
