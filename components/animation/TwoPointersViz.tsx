'use client';
import { motion } from 'framer-motion';

export default function TwoPointersViz({
  length,
  left,
  right,
}: {
  length: number;
  left: number;
  right: number;
}) {
  const arr = Array.from({ length }, (_, i) => i);
  return (
    <div className="rounded-[1.75rem] border border-white/10 bg-[#07141a] p-6 sm:p-8">
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-cyan-300">
        Pointer invariant · active range
      </p>
      <div className="mt-16 flex justify-center gap-2 sm:gap-3">
        {arr.map((_, idx) => (
          <div key={idx} className="relative">
            <motion.div
              animate={{
                borderColor:
                  idx >= left && idx <= right ? '#65d9e8' : '#314852',
                backgroundColor:
                  idx === left || idx === right
                    ? 'rgba(103,232,249,.12)'
                    : 'rgba(255,255,255,.02)',
              }}
              className="flex h-10 w-10 items-center justify-center rounded-lg border font-mono text-sm sm:h-12 sm:w-12"
            >
              {idx}
            </motion.div>
            {idx === left && (
              <motion.div
                className="absolute -top-8 left-1/2 -translate-x-1/2 font-mono text-xs text-cyan-300"
                animate={{ y: [0, -2, 0] }}
              >
                L
              </motion.div>
            )}
            {idx === right && (
              <motion.div
                className="absolute -bottom-8 left-1/2 -translate-x-1/2 font-mono text-xs text-amber-300"
                animate={{ y: [0, 2, 0] }}
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
