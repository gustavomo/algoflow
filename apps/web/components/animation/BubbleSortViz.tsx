'use client';

import { motion, useReducedMotion } from 'framer-motion';
import type { BubbleSortSnapshot } from '../../lib/algorithms/bubbleSort';

const WIDTH = 720;
const HEIGHT = 330;

export default function BubbleSortViz({
  snapshot,
}: {
  snapshot: BubbleSortSnapshot;
}) {
  const reducedMotion = useReducedMotion();
  const max = Math.max(...snapshot.items.map((item) => item.value), 1);
  const barWidth = Math.min(72, 470 / snapshot.items.length);
  const gap = 20;
  const groupWidth =
    snapshot.items.length * barWidth + (snapshot.items.length - 1) * gap;
  const startX = (WIDTH - groupWidth) / 2;

  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-line bg-surface shadow-2xl shadow-black/40">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-6 py-4 font-mono text-[10px] uppercase tracking-[0.2em] text-subtle">
        <span>Bubble Sort · execution trace</span>
        <span
          className={
            snapshot.phase === 'complete' ? 'text-success' : 'text-warning'
          }
        >
          {snapshot.phase}
        </span>
      </div>
      <div className="grid grid-cols-3 border-b border-line px-6 py-4 text-sm">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-faint">
            Pass
          </p>
          <motion.p
            key={snapshot.pass}
            initial={reducedMotion ? false : { opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-1 text-xl"
          >
            {snapshot.pass}
          </motion.p>
        </div>
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-faint">
            Comparisons
          </p>
          <motion.p
            key={snapshot.comparisonCount}
            initial={reducedMotion ? false : { opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-1 text-xl text-ink"
          >
            {snapshot.comparisonCount}
          </motion.p>
        </div>
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-faint">
            Swaps
          </p>
          <motion.p
            key={snapshot.swapCount}
            initial={reducedMotion ? false : { opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-1 text-xl text-ink-soft"
          >
            {snapshot.swapCount}
          </motion.p>
        </div>
      </div>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label={`Bubble Sort ${snapshot.phase}: ${snapshot.narration}`}
        className="block h-auto w-full"
      >
        <defs>
          <linearGradient id="bar-idle" x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#3f3f46" />
            <stop offset="1" stopColor="#18181b" />
          </linearGradient>
          <linearGradient id="bar-active" x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#fafaf9" />
            <stop offset="1" stopColor="#78716c" />
          </linearGradient>
          <pattern
            id="bar-sorted"
            width="8"
            height="8"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <rect width="8" height="8" fill="#52525b" />
            <rect width="3" height="8" fill="#a1a1aa" />
          </pattern>
        </defs>
        {[0, 1, 2, 3].map((line) => (
          <line
            key={line}
            x1="70"
            x2="650"
            y1={80 + line * 56}
            y2={80 + line * 56}
            stroke="#fafaf9"
            strokeOpacity="0.055"
            strokeDasharray="4 8"
          />
        ))}
        <line
          x1="60"
          x2="660"
          y1="282"
          y2="282"
          stroke="#a8a29e"
          strokeOpacity="0.25"
        />
        {snapshot.items.map((item, index) => {
          const active = snapshot.compared?.includes(index) ?? false;
          const sorted = index >= snapshot.sortedFrom;
          const barHeight = 45 + (item.value / max) * 150;
          const targetX = startX + index * (barWidth + gap);
          return (
            <motion.g
              key={item.id}
              initial={false}
              animate={{ x: targetX }}
              transition={
                reducedMotion
                  ? { duration: 0.01 }
                  : { type: 'spring', stiffness: 260, damping: 28 }
              }
            >
              {active && !reducedMotion && (
                <motion.rect
                  x={-8}
                  y={73}
                  width={barWidth + 16}
                  height={218}
                  rx={14}
                  fill="#fafaf9"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0.03, 0.11, 0.03] }}
                  transition={{ repeat: Infinity, duration: 1.2 }}
                />
              )}
              <motion.rect
                x={0}
                width={barWidth}
                rx={10}
                initial={false}
                animate={{
                  y: 282 - barHeight,
                  height: barHeight,
                  fill: sorted
                    ? 'url(#bar-sorted)'
                    : active
                      ? 'url(#bar-active)'
                      : 'url(#bar-idle)',
                }}
                transition={{ duration: reducedMotion ? 0.01 : 0.28 }}
                stroke={sorted ? '#d6d3d1' : active ? '#ffffff' : '#57534e'}
                strokeOpacity={active || sorted ? 0.7 : 0.25}
              />
              <text
                x={barWidth / 2}
                y={306}
                textAnchor="middle"
                fill={active ? '#ffffff' : sorted ? '#d6d3d1' : '#78716c'}
                fontFamily="ui-monospace, monospace"
                fontSize="15"
              >
                {item.value}
              </text>
              {(active || sorted) && (
                <text
                  x={barWidth / 2}
                  y={68}
                  textAnchor="middle"
                  fill="#fafaf9"
                  fontFamily="ui-monospace, monospace"
                  fontSize="10"
                  letterSpacing="1"
                >
                  {active ? 'ACTIVE' : 'SETTLED'}
                </text>
              )}
            </motion.g>
          );
        })}
        {snapshot.compared && (
          <motion.path
            initial={reducedMotion ? false : { opacity: 0, pathLength: 0 }}
            animate={{ opacity: 1, pathLength: 1 }}
            d={`M ${startX + snapshot.compared[0] * (barWidth + gap) + barWidth / 2} 52 Q ${WIDTH / 2} 18 ${startX + snapshot.compared[1] * (barWidth + gap) + barWidth / 2} 52`}
            fill="none"
            stroke="#ffffff"
            strokeWidth="2"
            strokeDasharray="5 6"
          />
        )}
        {snapshot.compared && (
          <text
            x={WIDTH / 2}
            y="20"
            textAnchor="middle"
            fill="#fafaf9"
            fontFamily="ui-monospace, monospace"
            fontSize="10"
            letterSpacing="2"
          >
            COMPARE PAIR
          </text>
        )}
      </svg>
      <div className="border-t border-line px-6 py-5">
        <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-faint">
          Current decision
        </p>
        <motion.p
          key={`${snapshot.phase}-${snapshot.comparisonCount}-${snapshot.swapCount}`}
          initial={reducedMotion ? false : { opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 min-h-12 text-sm leading-6 text-ink-soft"
        >
          {snapshot.narration}
        </motion.p>
      </div>
    </div>
  );
}
