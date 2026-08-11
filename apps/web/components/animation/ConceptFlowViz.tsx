'use client';

import { motion, useReducedMotion } from 'framer-motion';
import type {
  ConceptFlowNarrative,
  ConceptFlowStep,
} from '@algoflow/contracts';

function coordinates(index: number, total: number) {
  const spacing = total > 1 ? 660 / (total - 1) : 0;
  return { x: 70 + index * spacing, y: 132 };
}

export default function ConceptFlowViz({
  narrative,
  step,
}: {
  narrative: ConceptFlowNarrative;
  step: ConceptFlowStep;
}) {
  const reducedMotion = useReducedMotion();
  const nodeById = new Map(
    narrative.nodes.map((node, index) => [
      node.id,
      { node, ...coordinates(index, narrative.nodes.length) },
    ]),
  );
  const activeConnections = new Set(step.activeConnectionIndexes ?? []);

  return (
    <div className="overflow-hidden rounded-3xl border border-line-strong bg-surface">
      <div className="flex items-center justify-between border-b border-line px-5 py-4">
        <p className="eyebrow">Concept flow</p>
        <span className="rounded-full border border-line px-3 py-1 font-mono text-[9px] uppercase tracking-[0.16em] text-warning">
          {step.label}
        </span>
      </div>
      <svg
        viewBox="0 0 800 280"
        className="block h-auto w-full"
        role="img"
        aria-label={`${step.label}. ${step.narration}`}
      >
        <defs>
          <pattern
            id="concept-grid"
            width="24"
            height="24"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 24 0 L 0 0 0 24"
              fill="none"
              stroke="rgb(var(--color-line))"
              strokeWidth="0.5"
              opacity="0.35"
            />
          </pattern>
        </defs>
        <rect width="800" height="280" fill="url(#concept-grid)" />
        {narrative.connections.map((connection, index) => {
          const from = nodeById.get(connection.from);
          const to = nodeById.get(connection.to);
          if (!from || !to) return null;
          const active = activeConnections.has(index);
          return (
            <g key={`${connection.from}-${connection.to}`}>
              <line
                x1={from.x + 54}
                y1={from.y}
                x2={to.x - 54}
                y2={to.y}
                stroke={active ? '#fafaf9' : '#57534e'}
                strokeWidth={active ? 3 : 1.5}
                strokeDasharray={active ? undefined : '7 7'}
              />
              {active && !reducedMotion && (
                <motion.circle
                  r="5"
                  cy={from.y}
                  fill="#fafaf9"
                  initial={{ cx: from.x + 54 }}
                  animate={{ cx: to.x - 54 }}
                  transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                />
              )}
            </g>
          );
        })}
        {narrative.nodes.map((node, index) => {
          const { x, y } = coordinates(index, narrative.nodes.length);
          const active = step.activeNodeIds.includes(node.id);
          return (
            <motion.g
              key={node.id}
              animate={{ opacity: active ? 1 : 0.52, scale: active ? 1 : 0.96 }}
              transition={{ duration: reducedMotion ? 0.01 : 0.25 }}
              style={{ transformOrigin: `${x}px ${y}px` }}
            >
              <rect
                x={x - 55}
                y={y - 42}
                width="110"
                height="84"
                rx="18"
                fill={active ? '#fafaf9' : '#181818'}
                stroke={active ? '#fafaf9' : '#57534e'}
                strokeWidth={active ? 3 : 1.5}
              />
              <text
                x={x}
                y={y - 2}
                textAnchor="middle"
                fill={active ? '#050505' : '#d6d3d1'}
                fontSize="13"
                fontWeight={active ? 700 : 500}
              >
                {node.label.length > 16
                  ? `${node.label.slice(0, 15)}…`
                  : node.label}
              </text>
              <text
                x={x}
                y={y + 19}
                textAnchor="middle"
                fill={active ? '#44403c' : '#78716c'}
                fontSize="9"
                letterSpacing="1.4"
              >
                {active ? 'ACTIVE' : `0${index + 1}`}
              </text>
            </motion.g>
          );
        })}
      </svg>
      <div className="border-t border-line px-5 py-5">
        {step.metric && <p className="eyebrow text-warning">{step.metric}</p>}
        <p className="mt-2 min-h-12 text-sm leading-6 text-ink-soft">
          {step.narration}
        </p>
      </div>
    </div>
  );
}
