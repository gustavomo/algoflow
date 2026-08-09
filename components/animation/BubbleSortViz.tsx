'use client';
import { motion } from 'framer-motion';
import { useEffect } from 'react';

interface Step {
  i: number;
  j: number;
  swapped?: boolean;
}

export default function BubbleSortViz({ values, step }: { values: number[]; step: Step }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === ' ') e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <svg width={200} height={100} className="border">
      {values.map((v, idx) => {
        const x = idx * 30;
        const isActive = idx === step.i || idx === step.j;
        return (
          <motion.rect
            key={idx}
            x={x}
            y={100 - v * 10}
            width={20}
            height={v * 10}
            fill={isActive ? 'orange' : 'gray'}
            layout
          />
        );
      })}
    </svg>
  );
}
