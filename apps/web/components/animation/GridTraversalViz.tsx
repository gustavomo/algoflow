'use client';

import { motion, useReducedMotion } from 'framer-motion';
import type { GridTraversalSnapshot } from '../../lib/algorithms/gridTraversal';

const CELL = 52;
const OFFSET = 36;

export default function GridTraversalViz({
  snapshot,
}: {
  snapshot: GridTraversalSnapshot;
}) {
  const reduced = useReducedMotion();
  const visited = new Set(snapshot.visited);
  const frontier = new Set(snapshot.frontier);
  const path = new Set(snapshot.path);
  const size = snapshot.size * CELL + OFFSET * 2;

  return (
    <section className="border-y border-line bg-surface/40 py-5">
      <header className="flex flex-wrap items-end justify-between gap-4 px-1">
        <div>
          <p className="eyebrow">
            {snapshot.mode.toUpperCase()} ·{' '}
            {snapshot.mode === 'bfs' ? 'FIFO queue' : 'LIFO stack'}
          </p>
          <p className="mt-2 text-sm text-ink-soft">
            {snapshot.visited.length} visited · {snapshot.frontier.length}{' '}
            waiting
          </p>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-warning">
          {snapshot.phase}
        </span>
      </header>
      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_170px] lg:items-center">
        <svg
          viewBox={`0 0 ${size} ${size}`}
          className="mx-auto block w-full max-w-[420px]"
          role="img"
          aria-label={snapshot.narration}
        >
          {Array.from({ length: snapshot.size * snapshot.size }, (_, index) => {
            const row = Math.floor(index / snapshot.size);
            const column = index % snapshot.size;
            const x = OFFSET + column * CELL;
            const y = OFFSET + row * CELL;
            const wall = snapshot.walls.includes(index);
            const current = snapshot.current === index;
            const isPath = path.has(index);
            const discovered = frontier.has(index);
            return (
              <motion.g
                key={index}
                initial={false}
                animate={{
                  opacity: wall ? 0.36 : 1,
                  scale: current ? 1.06 : 1,
                }}
                transition={{ duration: reduced ? 0.01 : 0.22 }}
                style={{ transformOrigin: `${x + 20}px ${y + 20}px` }}
              >
                <rect
                  x={x}
                  y={y}
                  width="40"
                  height="40"
                  rx={wall ? 3 : 20}
                  fill={
                    wall
                      ? 'rgb(var(--color-line))'
                      : current
                        ? 'rgb(var(--color-ink))'
                        : isPath
                          ? 'rgb(var(--color-line-strong))'
                          : visited.has(index)
                            ? 'rgb(var(--color-line))'
                            : discovered
                              ? 'rgb(var(--color-surface-raised))'
                              : 'rgb(var(--color-canvas))'
                  }
                  stroke={
                    current
                      ? 'rgb(var(--color-ink))'
                      : isPath
                        ? 'rgb(var(--color-ink))'
                        : discovered
                          ? 'rgb(var(--color-ink-soft))'
                          : 'rgb(var(--color-line-strong))'
                  }
                  strokeWidth={current || isPath ? 3 : 1}
                  strokeDasharray={discovered && !current ? '4 3' : undefined}
                />
                <text
                  x={x + 20}
                  y={y + 24}
                  textAnchor="middle"
                  fill={
                    current
                      ? 'rgb(var(--color-canvas))'
                      : wall
                        ? 'rgb(var(--color-faint))'
                        : 'rgb(var(--color-ink-soft))'
                  }
                  fontSize="10"
                  fontFamily="ui-monospace, monospace"
                >
                  {wall ? '×' : index}
                </text>
              </motion.g>
            );
          })}
        </svg>
        <aside className="border-l border-line pl-4">
          <p className="eyebrow">Frontier order</p>
          <ol className="mt-3 flex flex-wrap gap-2 lg:flex-col">
            {snapshot.frontier.length ? (
              snapshot.frontier.map((cell, index) => (
                <li key={cell} className="font-mono text-xs text-ink-soft">
                  <span className="mr-2 text-faint">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  cell {cell}
                </li>
              ))
            ) : (
              <li className="font-mono text-xs text-success">
                empty · complete
              </li>
            )}
          </ol>
        </aside>
      </div>
      <p className="min-h-14 border-t border-line px-1 pt-4 text-sm leading-6 text-muted">
        {snapshot.narration}
      </p>
    </section>
  );
}
