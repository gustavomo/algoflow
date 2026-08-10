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
    <div className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#07141a] shadow-2xl shadow-cyan-950/20">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] px-6 py-4 font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">
        <span>Bubble Sort · execution trace</span>
        <span
          className={
            snapshot.phase === 'complete'
              ? 'text-emerald-300'
              : 'text-amber-300'
          }
        >
          {snapshot.phase}
        </span>
      </div>
      <div className="grid grid-cols-3 border-b border-white/[0.08] px-6 py-4 text-sm">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-slate-600">
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
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-slate-600">
            Comparisons
          </p>
          <motion.p
            key={snapshot.comparisonCount}
            initial={reducedMotion ? false : { opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-1 text-xl text-cyan-200"
          >
            {snapshot.comparisonCount}
          </motion.p>
        </div>
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-slate-600">
            Swaps
          </p>
          <motion.p
            key={snapshot.swapCount}
            initial={reducedMotion ? false : { opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-1 text-xl text-amber-200"
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
            <stop stopColor="#25404b" />
            <stop offset="1" stopColor="#13262f" />
          </linearGradient>
          <linearGradient id="bar-active" x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#f7c66b" />
            <stop offset="1" stopColor="#a86a17" />
          </linearGradient>
          <linearGradient id="bar-sorted" x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#82f5e5" />
            <stop offset="1" stopColor="#1d7d76" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3].map((line) => (
          <line
            key={line}
            x1="70"
            x2="650"
            y1={80 + line * 56}
            y2={80 + line * 56}
            stroke="#d9f8ff"
            strokeOpacity="0.055"
            strokeDasharray="4 8"
          />
        ))}
        <line
          x1="60"
          x2="660"
          y1="282"
          y2="282"
          stroke="#6f93a3"
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
                  fill="#f3b74d"
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
                stroke={sorted ? '#88f5e6' : active ? '#ffd184' : '#63818e'}
                strokeOpacity={active || sorted ? 0.7 : 0.25}
              />
              <text
                x={barWidth / 2}
                y={306}
                textAnchor="middle"
                fill={active ? '#ffd184' : sorted ? '#95f4e8' : '#77929d'}
                fontFamily="ui-monospace, monospace"
                fontSize="15"
              >
                {item.value}
              </text>
            </motion.g>
          );
        })}
        {snapshot.compared && (
          <motion.path
            initial={reducedMotion ? false : { opacity: 0, pathLength: 0 }}
            animate={{ opacity: 1, pathLength: 1 }}
            d={`M ${startX + snapshot.compared[0] * (barWidth + gap) + barWidth / 2} 52 Q ${WIDTH / 2} 18 ${startX + snapshot.compared[1] * (barWidth + gap) + barWidth / 2} 52`}
            fill="none"
            stroke="#f6bd61"
            strokeWidth="2"
            strokeDasharray="5 6"
          />
        )}
      </svg>
      <div className="border-t border-white/[0.08] px-6 py-5">
        <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-slate-600">
          Current decision
        </p>
        <motion.p
          key={`${snapshot.phase}-${snapshot.comparisonCount}-${snapshot.swapCount}`}
          initial={reducedMotion ? false : { opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 min-h-12 text-sm leading-6 text-slate-300"
        >
          {snapshot.narration}
        </motion.p>
      </div>
    </div>
  );
}
