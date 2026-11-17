'use client';

import { useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import type { BubbleSortSnapshot } from '@algoflow/learning-engine';
import {
  BUBBLE_VIEW_WIDTH,
  bubbleBarLayout,
  bubbleBarX,
  clampBarDrag,
  dragSwapNeighbor,
} from '../../lib/animation/bubbleSortLayout';

const WIDTH = BUBBLE_VIEW_WIDTH;
const HEIGHT = 330;
// Pointer travel (in SVG units) after which a press counts as a drag.
const DRAG_THRESHOLD = 6;

export default function BubbleSortViz({
  snapshot,
  mode = 'trace',
  selectedItemIds = [],
  tutorItemIds = [],
  tutorLabel,
  onSelectItem,
  onSwapIntent,
}: {
  snapshot: BubbleSortSnapshot;
  mode?: 'trace' | 'challenge';
  selectedItemIds?: string[];
  tutorItemIds?: string[];
  tutorLabel?: string;
  onSelectItem?: (itemId: string) => void;
  onSwapIntent?: (itemIds: [string, string]) => void;
}) {
  const reducedMotion = useReducedMotion();
  const max = Math.max(...snapshot.items.map((item) => item.value), 1);
  const layout = bubbleBarLayout(snapshot.items.length);
  const { barWidth } = layout;
  const draggable = Boolean(onSwapIntent) && !reducedMotion;
  // Dragging is handled with pointer events on an inner <g>. framer-motion's
  // `drag` must not be used here: it attaches a layout projection node whose
  // reset writes `transform: none` on the SVG group and erases the animated x.
  const gesture = useRef<{
    itemId: string;
    startX: number;
    scale: number;
    offset: number;
  } | null>(null);
  const suppressClick = useRef(false);
  const [dragging, setDragging] = useState<{
    itemId: string;
    offset: number;
  } | null>(null);
  const endGesture = () => {
    gesture.current = null;
    setDragging(null);
  };

  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-line bg-surface shadow-elevated">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-6 py-4 font-mono text-[10px] uppercase tracking-[0.2em] text-subtle">
        <span>
          Bubble Sort ·{' '}
          {mode === 'challenge' ? 'decision lab' : 'execution trace'}
        </span>
        <span
          className={
            snapshot.phase === 'complete' ? 'text-success' : 'text-warning'
          }
        >
          {snapshot.phase}
        </span>
      </div>
      <div className="grid grid-cols-3 border-b border-line px-4 py-4 text-sm sm:px-6">
        <div>
          <p className="font-mono text-[8px] uppercase tracking-[0.1em] text-faint sm:text-[9px] sm:tracking-[0.2em]">
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
          <p className="font-mono text-[8px] uppercase tracking-[0.1em] text-faint sm:text-[9px] sm:tracking-[0.2em]">
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
          <p className="font-mono text-[8px] uppercase tracking-[0.1em] text-faint sm:text-[9px] sm:tracking-[0.2em]">
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
            <stop stopColor="rgb(var(--color-line-strong))" />
            <stop offset="1" stopColor="rgb(var(--color-surface-raised))" />
          </linearGradient>
          <linearGradient id="bar-active" x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="rgb(var(--color-ink))" />
            <stop offset="1" stopColor="rgb(var(--color-subtle))" />
          </linearGradient>
          <pattern
            id="bar-sorted"
            width="8"
            height="8"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <rect width="8" height="8" fill="rgb(var(--color-line-strong))" />
            <rect width="3" height="8" fill="rgb(var(--color-muted))" />
          </pattern>
        </defs>
        {[0, 1, 2, 3].map((line) => (
          <line
            key={line}
            x1="70"
            x2="650"
            y1={80 + line * 56}
            y2={80 + line * 56}
            stroke="rgb(var(--color-ink))"
            strokeOpacity="0.055"
            strokeDasharray="4 8"
          />
        ))}
        <line
          x1="60"
          x2="660"
          y1="282"
          y2="282"
          stroke="rgb(var(--color-muted))"
          strokeOpacity="0.25"
        />
        {snapshot.items.map((item, index) => {
          const active = snapshot.compared?.includes(index) ?? false;
          const selected = selectedItemIds.includes(item.id);
          const tutorFocused = tutorItemIds.includes(item.id);
          const sorted = index >= snapshot.sortedFrom;
          const barHeight = 45 + (item.value / max) * 150;
          const dragOffset = dragging?.itemId === item.id ? dragging.offset : 0;
          return (
            <motion.g
              key={item.id}
              initial={false}
              animate={{ x: bubbleBarX(layout, index) }}
              onClick={() => {
                if (suppressClick.current) {
                  suppressClick.current = false;
                  return;
                }
                onSelectItem?.(item.id);
              }}
              onKeyDown={(event) => {
                if (!onSelectItem) return;
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onSelectItem(item.id);
                }
              }}
              tabIndex={onSelectItem ? 0 : undefined}
              role={onSelectItem ? 'button' : undefined}
              aria-pressed={onSelectItem ? selected : undefined}
              aria-label={
                onSelectItem
                  ? `${selected ? 'Deselect' : 'Select'} value ${item.value}`
                  : undefined
              }
              transition={
                reducedMotion
                  ? { duration: 0.01 }
                  : { type: 'spring', stiffness: 260, damping: 28 }
              }
            >
              <g
                data-bar={item.id}
                transform={`translate(${dragOffset} 0)`}
                style={
                  draggable
                    ? { touchAction: 'pan-y', cursor: 'grab' }
                    : onSelectItem
                      ? { cursor: 'pointer' }
                      : undefined
                }
                onPointerDown={(event) => {
                  if (!draggable) return;
                  const svg = event.currentTarget.ownerSVGElement;
                  const width = svg?.getBoundingClientRect().width ?? 0;
                  suppressClick.current = false;
                  gesture.current = {
                    itemId: item.id,
                    startX: event.clientX,
                    scale: width > 0 ? WIDTH / width : 1,
                    offset: 0,
                  };
                  event.currentTarget.setPointerCapture?.(event.pointerId);
                }}
                onPointerMove={(event) => {
                  const current = gesture.current;
                  if (!current || current.itemId !== item.id) return;
                  current.offset = clampBarDrag(
                    layout,
                    (event.clientX - current.startX) * current.scale,
                  );
                  if (Math.abs(current.offset) >= DRAG_THRESHOLD)
                    suppressClick.current = true;
                  setDragging({ itemId: item.id, offset: current.offset });
                }}
                onPointerUp={() => {
                  const current = gesture.current;
                  if (!current || current.itemId !== item.id) return;
                  const neighborIndex = dragSwapNeighbor(
                    layout,
                    index,
                    current.offset,
                    snapshot.items.length,
                  );
                  endGesture();
                  if (neighborIndex !== null)
                    onSwapIntent?.([item.id, snapshot.items[neighborIndex].id]);
                }}
                onPointerCancel={endGesture}
              >
                {(active || tutorFocused) && !reducedMotion && (
                  <motion.rect
                    x={-8}
                    y={73}
                    width={barWidth + 16}
                    height={218}
                    rx={14}
                    fill="rgb(var(--color-ink))"
                    initial={{ opacity: 0 }}
                    animate={{
                      opacity: tutorFocused
                        ? [0.06, 0.16, 0.06]
                        : [0.03, 0.11, 0.03],
                    }}
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
                  stroke={
                    selected || active || tutorFocused
                      ? 'rgb(var(--color-ink))'
                      : sorted
                        ? 'rgb(var(--color-ink-soft))'
                        : 'rgb(var(--color-line-strong))'
                  }
                  strokeWidth={selected ? 4 : tutorFocused ? 3 : 1}
                  strokeOpacity={
                    selected || active || tutorFocused || sorted ? 0.7 : 0.25
                  }
                />
                <text
                  x={barWidth / 2}
                  y={306}
                  textAnchor="middle"
                  fill={
                    active
                      ? 'rgb(var(--color-ink))'
                      : sorted
                        ? 'rgb(var(--color-ink-soft))'
                        : 'rgb(var(--color-subtle))'
                  }
                  fontFamily="ui-monospace, monospace"
                  fontSize="15"
                >
                  {item.value}
                </text>
                {(selected || active || tutorFocused || sorted) && (
                  <text
                    x={barWidth / 2}
                    y={68}
                    textAnchor="middle"
                    fill="rgb(var(--color-ink))"
                    fontFamily="ui-monospace, monospace"
                    fontSize="10"
                    letterSpacing="1"
                  >
                    {selected
                      ? 'SELECTED'
                      : tutorFocused
                        ? 'TUTOR FOCUS'
                        : active
                          ? 'ACTIVE'
                          : 'SETTLED'}
                  </text>
                )}
              </g>
            </motion.g>
          );
        })}
        {snapshot.compared && (
          <motion.path
            initial={reducedMotion ? false : { opacity: 0, pathLength: 0 }}
            animate={{ opacity: 1, pathLength: 1 }}
            d={`M ${bubbleBarX(layout, snapshot.compared[0]) + barWidth / 2} 52 Q ${WIDTH / 2} 18 ${bubbleBarX(layout, snapshot.compared[1]) + barWidth / 2} 52`}
            fill="none"
            stroke="rgb(var(--color-ink))"
            strokeWidth="2"
            strokeDasharray="5 6"
          />
        )}
        {snapshot.compared && (
          <text
            x={WIDTH / 2}
            y="20"
            textAnchor="middle"
            fill="rgb(var(--color-ink))"
            fontFamily="ui-monospace, monospace"
            fontSize="10"
            letterSpacing="2"
          >
            COMPARE PAIR
          </text>
        )}
        {tutorLabel && tutorItemIds.length > 0 && (
          <text
            x={WIDTH / 2}
            y="326"
            textAnchor="middle"
            fill="rgb(var(--color-muted))"
            fontFamily="ui-monospace, monospace"
            fontSize="9"
            letterSpacing="1"
          >
            {tutorLabel.slice(0, 80).toUpperCase()}
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
