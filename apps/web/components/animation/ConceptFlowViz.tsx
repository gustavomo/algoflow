'use client';

import { motion, useReducedMotion } from 'framer-motion';
import type {
  ConceptFlowNarrative,
  ConceptFlowStep,
  VisualSceneKind,
} from '@algoflow/contracts';

interface Point {
  x: number;
  y: number;
}

function polar(index: number, total: number, radius = 112): Point {
  const angle = -Math.PI / 2 + (index / Math.max(total, 1)) * Math.PI * 2;
  return {
    x: 400 + Math.cos(angle) * radius,
    y: 165 + Math.sin(angle) * radius,
  };
}

function pointFor(scene: VisualSceneKind, index: number, total: number): Point {
  if (scene === 'event-loop' || scene === 'agent-loop')
    return polar(index, total, scene === 'agent-loop' ? 122 : 108);
  if (scene === 'cdn-route')
    return {
      x: 78 + index * (640 / Math.max(1, total - 1)),
      y: index % 2 ? 105 : 205,
    };
  if (scene === 'relational-schema')
    return (
      [
        { x: 130, y: 175 },
        { x: 300, y: 90 },
        { x: 485, y: 175 },
        { x: 675, y: 95 },
      ][index] ?? { x: 400, y: 170 }
    );
  if (scene === 'container-layers') return { x: 400, y: 238 - index * 47 };
  if (scene === 'vector-space')
    return (
      [
        { x: 115, y: 225 },
        { x: 280, y: 155 },
        { x: 480, y: 85 },
        { x: 665, y: 145 },
      ][index] ?? { x: 400, y: 170 }
    );
  if (scene === 'active-reading')
    return {
      x: 75 + index * (650 / Math.max(1, total - 1)),
      y: index % 2 ? 105 : 220,
    };
  if (scene === 'strategy-map')
    return {
      x: 145 + index * (520 / Math.max(1, total - 1)),
      y: 110 + index * 38,
    };
  if (scene === 'migration-timeline')
    return {
      x: 70 + index * (660 / Math.max(1, total - 1)),
      y: index === total - 2 ? 95 : 175,
    };
  return polar(index, total, 118);
}

function connectionPath(from: Point, to: Point) {
  const middleX = (from.x + to.x) / 2;
  const bend = Math.abs(from.y - to.y) < 12 ? -42 : 0;
  return `M ${from.x} ${from.y} Q ${middleX} ${(from.y + to.y) / 2 + bend} ${to.x} ${to.y}`;
}

function SceneBackdrop({ scene }: { scene: VisualSceneKind }) {
  if (scene === 'vector-space')
    return (
      <g opacity=".55">
        <line x1="70" y1="270" x2="730" y2="270" stroke="#57534e" />
        <line x1="90" y1="292" x2="90" y2="28" stroke="#57534e" />
        <path d="M90 270 L650 58" stroke="#292524" strokeDasharray="4 8" />
      </g>
    );
  if (scene === 'migration-timeline')
    return (
      <g>
        <line
          x1="55"
          y1="175"
          x2="745"
          y2="175"
          stroke="#57534e"
          strokeWidth="2"
        />
        <path
          d="M470 175 C520 260 610 260 660 175"
          fill="none"
          stroke="#57534e"
          strokeDasharray="7 6"
        />
        <text x="560" y="260" textAnchor="middle" fill="#78716c" fontSize="10">
          rollback lane
        </text>
      </g>
    );
  if (scene === 'cdn-route')
    return (
      <path
        d="M30 245 C170 45 285 250 420 90 C540 -15 650 255 770 55"
        fill="none"
        stroke="#292524"
        strokeWidth="28"
        strokeLinecap="round"
      />
    );
  if (scene === 'system-boundaries' || scene === 'impact-ripple')
    return (
      <circle
        cx="400"
        cy="165"
        r="145"
        fill="none"
        stroke="#292524"
        strokeDasharray="4 8"
      />
    );
  return null;
}

function SceneNode({
  scene,
  point,
  index,
  total,
  label,
  active,
  completed,
  failed,
  reduced,
}: {
  scene: VisualSceneKind;
  point: Point;
  index: number;
  total: number;
  label: string;
  active: boolean;
  completed: boolean;
  failed: boolean;
  reduced: boolean;
}) {
  const stroke = failed
    ? '#fda4af'
    : active
      ? '#fafaf9'
      : completed
        ? '#a8a29e'
        : '#57534e';
  const fill = active ? '#fafaf9' : completed ? '#292929' : '#101010';
  const text = active ? '#050505' : failed ? '#fda4af' : '#e7e5e4';
  const common = {
    animate: {
      opacity: active || completed || failed ? 1 : 0.42,
      scale: active ? 1.06 : 1,
    },
    transition: { duration: reduced ? 0.01 : 0.25 },
    style: { transformOrigin: `${point.x}px ${point.y}px` },
  };

  if (scene === 'system-boundaries' || scene === 'impact-ripple') {
    const radius = 34 + index * (scene === 'impact-ripple' ? 30 : 27);
    return (
      <motion.g {...common}>
        <circle
          cx="400"
          cy="165"
          r={radius}
          fill={index === 0 && active ? fill : 'none'}
          stroke={stroke}
          strokeWidth={active ? 4 : 1.5}
          strokeDasharray={failed ? '5 4' : undefined}
        />
        <text
          x={405 + radius}
          y={160 - index * 2}
          fill={text}
          fontSize="10"
          fontWeight={active ? 700 : 500}
        >
          {label}
        </text>
      </motion.g>
    );
  }

  if (scene === 'container-layers') {
    const width = 350 - index * 28;
    return (
      <motion.g {...common}>
        <path
          d={`M ${point.x - width / 2} ${point.y} l 28 -18 h ${width - 56} l 28 18 l -28 18 h -${width - 56} z`}
          fill={fill}
          stroke={stroke}
          strokeWidth={active ? 3 : 1.5}
        />
        <text
          x={point.x}
          y={point.y + 4}
          textAnchor="middle"
          fill={text}
          fontSize="11"
        >
          {label}
        </text>
      </motion.g>
    );
  }

  if (scene === 'strategy-map') {
    const width = 145 - index * 12;
    return (
      <motion.g {...common}>
        <path
          d={`M ${point.x - width / 2} ${point.y - 30} h ${width} l -18 60 h -${width - 36} z`}
          fill={fill}
          stroke={stroke}
          strokeWidth={active ? 3 : 1.5}
        />
        <text
          x={point.x}
          y={point.y + 4}
          textAnchor="middle"
          fill={text}
          fontSize="10"
        >
          {label.length > 18 ? `${label.slice(0, 17)}…` : label}
        </text>
      </motion.g>
    );
  }

  if (scene === 'relational-schema') {
    const shapes = [
      <ellipse
        key="entity"
        cx={point.x}
        cy={point.y}
        rx="62"
        ry="34"
        fill={fill}
        stroke={stroke}
        strokeWidth={active ? 3 : 1.5}
      />,
      <circle
        key="key"
        cx={point.x}
        cy={point.y}
        r="38"
        fill={fill}
        stroke={stroke}
        strokeWidth={active ? 3 : 1.5}
      />,
      <path
        key="relation"
        d={`M${point.x} ${point.y - 42} L${point.x + 58} ${point.y} L${point.x} ${point.y + 42} L${point.x - 58} ${point.y} Z`}
        fill={fill}
        stroke={stroke}
        strokeWidth={active ? 3 : 1.5}
      />,
      <path
        key="constraint"
        d={`M${point.x} ${point.y - 45} L${point.x + 44} ${point.y - 22} L${point.x + 32} ${point.y + 37} L${point.x} ${point.y + 52} L${point.x - 32} ${point.y + 37} L${point.x - 44} ${point.y - 22} Z`}
        fill={fill}
        stroke={stroke}
        strokeWidth={active ? 3 : 1.5}
      />,
    ];
    return (
      <motion.g {...common}>
        {shapes[index]}
        <text
          x={point.x}
          y={point.y + 4}
          textAnchor="middle"
          fill={text}
          fontSize="10"
        >
          {label.length > 16 ? `${label.slice(0, 15)}…` : label}
        </text>
      </motion.g>
    );
  }

  return (
    <motion.g {...common}>
      <circle
        cx={point.x}
        cy={point.y}
        r={scene === 'migration-timeline' ? 27 : 38}
        fill={fill}
        stroke={stroke}
        strokeWidth={active ? 4 : 1.5}
        strokeDasharray={failed ? '5 4' : undefined}
      />
      {scene === 'event-loop' && index === total - 1 && (
        <path
          d={`M${point.x - 48} ${point.y} A48 48 0 1 1 ${point.x + 15} ${point.y + 45}`}
          fill="none"
          stroke={stroke}
          strokeWidth="2"
        />
      )}
      <text
        x={point.x}
        y={point.y + 4}
        textAnchor="middle"
        fill={text}
        fontSize="10"
        fontWeight={active ? 700 : 500}
      >
        {label.length > 14 ? `${label.slice(0, 13)}…` : label}
      </text>
      <text
        x={point.x}
        y={point.y + 58}
        textAnchor="middle"
        fill="#78716c"
        fontSize="8"
        letterSpacing="1.2"
      >
        {String(index + 1).padStart(2, '0')}
      </text>
    </motion.g>
  );
}

export default function ConceptFlowViz({
  narrative,
  step,
}: {
  narrative: ConceptFlowNarrative;
  step: ConceptFlowStep;
}) {
  const reducedMotion = Boolean(useReducedMotion());
  const active = new Set(step.activeNodeIds);
  const completed = new Set(step.completedNodeIds ?? []);
  const failed = new Set(step.failedNodeIds ?? []);
  const activeConnections = new Set(step.activeConnectionIndexes ?? []);
  const points = narrative.nodes.map((_, index) =>
    pointFor(narrative.scene, index, narrative.nodes.length),
  );

  return (
    <section className="border-y border-line bg-surface/40 py-5">
      <header className="flex flex-wrap items-end justify-between gap-3 px-1">
        <div>
          <p className="eyebrow">{narrative.scene.replaceAll('-', ' ')}</p>
          <p className="mt-2 text-sm text-ink-soft">{step.label}</p>
        </div>
        <span
          className={`font-mono text-xs uppercase tracking-[0.12em] sm:text-[10px] sm:tracking-[0.2em] ${step.phase === 'failure' ? 'text-danger' : step.phase === 'terminal' ? 'text-success' : 'text-warning'}`}
        >
          {step.phase}
        </span>
      </header>
      <svg
        viewBox="0 0 800 320"
        className="mt-2 block h-auto w-full"
        role="img"
        aria-label={`${step.phase}. ${step.narration}`}
      >
        <SceneBackdrop scene={narrative.scene} />
        {narrative.connections.map((connection, index) => {
          const fromIndex = narrative.nodes.findIndex(
            (node) => node.id === connection.from,
          );
          const toIndex = narrative.nodes.findIndex(
            (node) => node.id === connection.to,
          );
          if (
            fromIndex < 0 ||
            toIndex < 0 ||
            (points[fromIndex].x === points[toIndex].x &&
              points[fromIndex].y === points[toIndex].y)
          )
            return null;
          const highlighted = activeConnections.has(index);
          return (
            <motion.path
              key={`${connection.from}-${connection.to}`}
              d={connectionPath(points[fromIndex], points[toIndex])}
              fill="none"
              stroke={highlighted ? '#fafaf9' : '#57534e'}
              strokeWidth={highlighted ? 3 : 1.5}
              strokeDasharray={highlighted ? undefined : '7 7'}
              initial={false}
              animate={{
                opacity: highlighted ? 1 : 0.42,
                pathLength: highlighted ? 1 : 0.9,
              }}
              transition={{ duration: reducedMotion ? 0.01 : 0.35 }}
            />
          );
        })}
        {narrative.nodes.map((node, index) => (
          <SceneNode
            key={node.id}
            scene={narrative.scene}
            point={points[index]}
            index={index}
            total={narrative.nodes.length}
            label={node.label}
            active={active.has(node.id)}
            completed={completed.has(node.id)}
            failed={failed.has(node.id)}
            reduced={reducedMotion}
          />
        ))}
      </svg>
      {/* The diagram's labels shrink below reading size on a phone, so the
          same nodes are listed at full size. The SVG keeps the topology. */}
      <ol
        data-node-legend
        className="mb-3 mt-1 flex flex-wrap gap-1.5 px-1 sm:hidden"
      >
        {narrative.nodes.map((node, index) => {
          const isActive = active.has(node.id);
          const isFailed = failed.has(node.id);
          return (
            <li
              key={node.id}
              aria-current={isActive ? 'step' : undefined}
              className={`rounded border px-2 py-1 text-xs leading-4 ${
                isFailed
                  ? 'border-danger text-danger'
                  : isActive
                    ? 'border-ink bg-ink font-semibold text-canvas'
                    : completed.has(node.id)
                      ? 'border-line-strong text-ink-soft'
                      : 'border-line text-subtle'
              }`}
            >
              <span className="mr-1.5 font-mono opacity-70">
                {String(index + 1).padStart(2, '0')}
              </span>
              {node.label}
            </li>
          );
        })}
      </ol>
      <div className="grid grid-cols-5 border-y border-line py-2 text-center font-mono text-[11px] uppercase tracking-tight text-faint sm:text-[9px] sm:tracking-wider">
        {(
          ['initial', 'transition', 'failure', 'recovery', 'terminal'] as const
        ).map((phase) => (
          <span
            key={phase}
            className={step.phase === phase ? 'text-ink' : undefined}
          >
            {phase}
          </span>
        ))}
      </div>
      <div className="px-1 pt-4">
        {step.metric && <p className="eyebrow text-warning">{step.metric}</p>}
        <p className="mt-2 min-h-12 text-sm leading-6 text-muted">
          {step.narration}
        </p>
        {step.phase === 'terminal' && (
          <p className="mt-3 border-l-2 border-success pl-3 text-xs leading-5 text-ink-soft">
            {narrative.terminalSummary}
          </p>
        )}
      </div>
    </section>
  );
}
