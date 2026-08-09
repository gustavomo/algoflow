'use client';
import { motion } from 'framer-motion';

export default function TwoPointersViz({ length, left, right }: { length: number; left: number; right: number }) {
  const arr = Array.from({ length }, (_, i) => i);
  return (
    <div className="flex gap-2">
      {arr.map((_, idx) => (
        <div key={idx} className="relative">
          <div className="w-8 h-8 border flex items-center justify-center">{idx}</div>
          {idx === left && (
            <motion.div className="absolute -top-4 left-1 text-xs" animate={{ y: [0, -2, 0] }}>
              L
            </motion.div>
          )}
          {idx === right && (
            <motion.div className="absolute -bottom-4 left-1 text-xs" animate={{ y: [0, 2, 0] }}>
              R
            </motion.div>
          )}
        </div>
      ))}
    </div>
  );
}
