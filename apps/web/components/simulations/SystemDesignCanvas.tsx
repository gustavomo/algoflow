'use client';

import { useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import type { SystemDesignGraph } from '@algoflow/contracts';

export default function SystemDesignCanvas({
  graph,
  onChange,
  selectedId,
  onSelect,
  connectingFrom,
  activeNodeId,
  activeEdgeId,
  emphasizedNodeIds = [],
  emphasizedEdgeIds = [],
}: {
  graph: SystemDesignGraph;
  onChange: (graph: SystemDesignGraph) => void;
  selectedId?: string;
  onSelect: (id: string) => void;
  connectingFrom?: string;
  activeNodeId?: string;
  activeEdgeId?: string;
  emphasizedNodeIds?: string[];
  emphasizedEdgeIds?: string[];
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const dragging = useRef<{ id: string; pointerId: number }>();
  const reducedMotion = useReducedMotion();
  const nodes = new Map(graph.nodes.map((node) => [node.id, node]));
  const emphasizedNodes = new Set(emphasizedNodeIds);
  const emphasizedEdges = new Set(emphasizedEdgeIds);

  function move(event: React.PointerEvent<SVGSVGElement>) {
    const current = dragging.current;
    if (!current || event.pointerId !== current.pointerId || !svgRef.current)
      return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = Math.max(
      70,
      Math.min(930, ((event.clientX - rect.left) / rect.width) * 1000),
    );
    const y = Math.max(
      50,
      Math.min(510, ((event.clientY - rect.top) / rect.height) * 560),
    );
    onChange({
      ...graph,
      nodes: graph.nodes.map((node) =>
        node.id === current.id
          ? { ...node, x: Math.round(x), y: Math.round(y) }
          : node,
      ),
    });
  }

  return (
    <div className="overflow-x-auto border-y border-line-strong bg-canvas">
      <svg
        ref={svgRef}
        viewBox="0 0 1000 560"
        className="block w-full min-w-[700px] touch-pan-x sm:min-w-0"
        aria-label="Editable system architecture canvas"
        onPointerMove={move}
        onPointerUp={(event) => {
          if (dragging.current?.pointerId === event.pointerId) {
            svgRef.current?.releasePointerCapture(event.pointerId);
            dragging.current = undefined;
          }
        }}
      >
        <defs>
          <pattern
            id="system-grid"
            width="32"
            height="32"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M32 0H0V32"
              fill="none"
              stroke="#2d2d2d"
              strokeWidth="1"
              opacity=".5"
            />
          </pattern>
        </defs>
        <rect width="1000" height="560" fill="url(#system-grid)" />
        {graph.edges.map((edge) => {
          const from = nodes.get(edge.from);
          const to = nodes.get(edge.to);
          if (!from || !to) return null;
          const active = edge.id === activeEdgeId;
          const emphasized = emphasizedEdges.has(edge.id);
          return (
            <g key={edge.id}>
              <line
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke={active || emphasized ? '#fafaf9' : '#57534e'}
                strokeWidth={active ? 5 : emphasized ? 3 : 2}
                strokeDasharray={
                  active ? undefined : emphasized ? '3 3' : '8 6'
                }
              />
              <circle
                cx={to.x}
                cy={to.y}
                r={active ? 6 : 4}
                fill={active ? '#fafaf9' : '#57534e'}
              />
              {edge.label && (
                <text
                  x={(from.x + to.x) / 2}
                  y={(from.y + to.y) / 2 - 8}
                  textAnchor="middle"
                  fill="#78716c"
                  fontSize="10"
                >
                  {edge.label}
                </text>
              )}
              {active && !reducedMotion && (
                <motion.circle
                  r="7"
                  fill="#fafaf9"
                  initial={{ cx: from.x, cy: from.y }}
                  animate={{ cx: to.x, cy: to.y }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                />
              )}
            </g>
          );
        })}
        {graph.nodes.map((node) => {
          const active = node.id === activeNodeId;
          const selected = node.id === selectedId;
          const source = node.id === connectingFrom;
          const emphasized = emphasizedNodes.has(node.id);
          return (
            <motion.g
              key={node.id}
              animate={{ opacity: active ? 1 : 0.88 }}
              onPointerDown={(event) => {
                event.stopPropagation();
                onSelect(node.id);
                dragging.current = { id: node.id, pointerId: event.pointerId };
                svgRef.current?.setPointerCapture(event.pointerId);
              }}
              style={{ cursor: 'grab', touchAction: 'none' }}
            >
              <rect
                x={node.x - 65}
                y={node.y - 38}
                width="130"
                height="76"
                rx="16"
                fill={active ? '#fafaf9' : emphasized ? '#292929' : '#181818'}
                stroke={
                  active
                    ? '#fafaf9'
                    : emphasized
                      ? '#fafaf9'
                      : source
                        ? '#d6d3d1'
                        : selected
                          ? '#a8a29e'
                          : '#57534e'
                }
                strokeWidth={
                  active ? 4 : emphasized || selected || source ? 3 : 1.5
                }
                strokeDasharray={
                  source ? '5 4' : emphasized ? '3 3' : undefined
                }
              />
              <text
                x={node.x}
                y={node.y - 3}
                textAnchor="middle"
                fill={active ? '#050505' : '#fafaf9'}
                fontSize="14"
                fontWeight="600"
              >
                {node.label.length > 18
                  ? `${node.label.slice(0, 17)}…`
                  : node.label}
              </text>
              <text
                x={node.x}
                y={node.y + 18}
                textAnchor="middle"
                fill={active ? '#44403c' : '#78716c'}
                fontSize="9"
                letterSpacing="1.1"
              >
                {node.type.toUpperCase()}
              </text>
            </motion.g>
          );
        })}
      </svg>
    </div>
  );
}
