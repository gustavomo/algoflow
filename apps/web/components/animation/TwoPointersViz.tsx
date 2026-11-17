'use client';

import { motion, useReducedMotion } from 'framer-motion';
import type { PointerSnapshot } from '../../lib/algorithms/pointerSteps';

export default function TwoPointersViz({
  snapshot,
  mode,
}: {
  snapshot: PointerSnapshot;
  mode: 'two-pointers' | 'sliding-window';
}) {
  const reducedMotion = useReducedMotion();
  const active = new Set(
    Array.from(
      { length: snapshot.right - snapshot.left + 1 },
      (_, index) => snapshot.left + index,
    ),
  );
  const best = snapshot.bestRange
    ? new Set(
        Array.from(
          { length: snapshot.bestRange[1] - snapshot.bestRange[0] + 1 },
          (_, index) => snapshot.bestRange![0] + index,
        ),
      )
    : new Set<number>();

  return (
    <section className="border-y border-line bg-surface/50 py-5 sm:py-7">
      <header className="flex flex-wrap items-end justify-between gap-3 px-1">
        <div>
          <p className="eyebrow">
            {mode === 'two-pointers'
              ? 'Monotonic search'
              : 'Incremental window'}
          </p>
          <p className="mt-2 text-sm text-ink-soft">
            {mode === 'two-pointers'
              ? `Target ${snapshot.target} · current sum ${snapshot.currentValue}`
              : `Window sum ${snapshot.currentValue} · best ${snapshot.bestValue ?? snapshot.currentValue}`}
          </p>
        </div>
        <span
          className={`font-mono text-[10px] uppercase tracking-[0.2em] ${
            snapshot.phase === 'failure'
              ? 'text-danger'
              : snapshot.phase === 'terminal'
                ? 'text-success'
                : 'text-warning'
          }`}
        >
          {snapshot.hypothetical ? 'counterexample' : snapshot.phase}
        </span>
      </header>

      <div className="mt-10 overflow-x-auto pb-8 pt-6">
        {/* Cells shrink to fit a phone; the fixed strip returns from `sm` up. */}
        <div className="mx-auto flex justify-center gap-1 px-1 sm:min-w-[560px] sm:gap-3 sm:px-6">
          {snapshot.values.map((value, index) => {
            const isLeft = index === snapshot.left;
            const isRight = index === snapshot.right;
            const discarded = snapshot.discardedIndexes.includes(index);
            const changing =
              index === snapshot.removedIndex || index === snapshot.addedIndex;
            return (
              <div
                key={`${index}-${value}`}
                className="relative min-w-0 max-w-14 flex-1 sm:w-14 sm:flex-none"
              >
                {isLeft && (
                  <motion.span
                    layoutId="left-pointer"
                    className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap font-mono text-xs font-semibold text-ink sm:text-[10px]"
                    transition={{ duration: reducedMotion ? 0.01 : 0.28 }}
                  >
                    L ↓
                  </motion.span>
                )}
                <motion.div
                  initial={false}
                  animate={{
                    opacity: discarded ? 0.28 : 1,
                    y: changing && !reducedMotion ? -5 : 0,
                    borderColor:
                      snapshot.phase === 'failure' && active.has(index)
                        ? '#fda4af'
                        : best.has(index) && snapshot.phase === 'terminal'
                          ? '#86efac'
                          : active.has(index)
                            ? '#fafaf9'
                            : '#44403c',
                    backgroundColor: active.has(index)
                      ? 'rgba(250,250,249,.1)'
                      : 'rgba(255,255,255,.01)',
                  }}
                  transition={{ duration: reducedMotion ? 0.01 : 0.28 }}
                  className={`grid h-14 place-items-center border-y font-mono text-sm sm:text-base ${discarded ? 'line-through' : ''}`}
                >
                  {value}
                </motion.div>
                <span className="mt-2 block text-center font-mono text-[11px] text-faint sm:text-[9px]">
                  {index}
                </span>
                {isRight && (
                  <motion.span
                    layoutId="right-pointer"
                    className="absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap font-mono text-xs font-semibold text-ink sm:text-[10px]"
                    transition={{ duration: reducedMotion ? 0.01 : 0.28 }}
                  >
                    ↑ R
                  </motion.span>
                )}
                {index === snapshot.removedIndex && (
                  <span className="absolute left-1/2 top-full mt-8 -translate-x-1/2 whitespace-nowrap font-mono text-[11px] text-danger sm:text-[9px]">
                    subtract
                  </span>
                )}
                {index === snapshot.addedIndex && (
                  <span className="absolute left-1/2 top-full mt-8 -translate-x-1/2 whitespace-nowrap font-mono text-[11px] text-success sm:text-[9px]">
                    add
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <p className="min-h-14 border-t border-line px-1 pt-4 text-sm leading-6 text-muted">
        {snapshot.narration}
      </p>
    </section>
  );
}
