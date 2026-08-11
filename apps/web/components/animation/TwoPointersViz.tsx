'use client';
import { motion, useReducedMotion } from 'framer-motion';

export default function TwoPointersViz({
  length,
  left,
  right,
}: {
  length: number;
  left: number;
  right: number;
}) {
  const reducedMotion = useReducedMotion();
  const arr = Array.from({ length }, (_, i) => i);
  return (
    <div className="rounded-[1.75rem] border border-line bg-surface p-6 sm:p-8">
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink">
        Pointer invariant · active range
      </p>
      <div className="mt-16 flex justify-center gap-1 sm:gap-3">
        {arr.map((_, idx) => (
          <div key={idx} className="relative">
            <motion.div
              animate={{
                borderColor:
                  idx >= left && idx <= right ? '#fafaf9' : '#44403c',
                backgroundColor:
                  idx === left || idx === right
                    ? 'rgba(250,250,249,.16)'
                    : 'rgba(255,255,255,.02)',
              }}
              className="flex h-8 w-8 items-center justify-center rounded-lg border font-mono text-xs sm:h-12 sm:w-12 sm:text-sm"
            >
              {idx}
            </motion.div>
            {idx === left && (
              <motion.div
                className="absolute -top-8 left-1/2 -translate-x-1/2 font-mono text-xs text-ink"
                animate={reducedMotion ? undefined : { y: [0, -2, 0] }}
              >
                L
              </motion.div>
            )}
            {idx === right && (
              <motion.div
                className="absolute -bottom-8 left-1/2 -translate-x-1/2 font-mono text-xs text-ink"
                animate={reducedMotion ? undefined : { y: [0, 2, 0] }}
              >
                R
              </motion.div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
