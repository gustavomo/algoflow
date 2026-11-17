'use client';

import { useId, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import type { SystemDesignGraph, VisualStagePhase } from '@algoflow/contracts';
import {
  SYSTEM_CANVAS_LANES,
  SYSTEM_EDGE_VISUALS,
  SYSTEM_PHASE_VISUALS,
  buildSystemEdgeGeometry,
  classifySystemEdge,
  parallelEdgePosition,
  type ActiveSystemFlow,
  type SystemEdgeVisualSpec,
  type SystemPoint,
} from '../../lib/simulations/visualGrammar';
import SystemNodeGlyph from './SystemNodeGlyph';

function FlowToken({
  point,
  visual,
  stroke,
}: {
  point: SystemPoint;
  visual: SystemEdgeVisualSpec;
  stroke: string;
}) {
  return (
    <g transform={`translate(${point.x} ${point.y})`} aria-hidden="true">
      {visual.token === 'circle' && <circle r="6" fill={stroke} />}
      {visual.token === 'square' && (
        <rect x="-5" y="-5" width="10" height="10" fill={stroke} />
      )}
      {visual.token === 'diamond' && (
        <path d="M0-7 7 0 0 7-7 0Z" fill={stroke} />
      )}
      {visual.token === 'double' && (
        <g fill={stroke}>
          <circle cx="-5" r="4" />
          <circle cx="5" r="4" />
        </g>
      )}
      {visual.token === 'cross' && (
        <g stroke={stroke} strokeWidth="3" strokeLinecap="round">
          <path d="M-7-7 7 7M7-7-7 7" />
        </g>
      )}
    </g>
  );
}

function MovingFlowToken({
  start,
  middle,
  end,
  visual,
}: {
  start: SystemPoint;
  middle: SystemPoint;
  end: SystemPoint;
  visual: SystemEdgeVisualSpec;
}) {
  return (
    <motion.g
      aria-hidden="true"
      initial={{ x: start.x, y: start.y }}
      animate={{
        x: [start.x, middle.x, end.x],
        y: [start.y, middle.y, end.y],
      }}
      transition={{ duration: 1.35, repeat: Infinity, ease: 'linear' }}
    >
      {visual.token === 'circle' && (
        <circle r="6" fill="rgb(var(--color-ink))" />
      )}
      {visual.token === 'square' && (
        <rect
          x="-5"
          y="-5"
          width="10"
          height="10"
          fill="rgb(var(--color-ink))"
        />
      )}
      {visual.token === 'diamond' && (
        <path d="M0-7 7 0 0 7-7 0Z" fill="rgb(var(--color-ink))" />
      )}
      {visual.token === 'double' && (
        <g fill="rgb(var(--color-ink))">
          <circle cx="-5" r="4" />
          <circle cx="5" r="4" />
        </g>
      )}
      {visual.token === 'cross' && (
        <g stroke="rgb(var(--color-ink))" strokeWidth="3" strokeLinecap="round">
          <path d="M-7-7 7 7M7-7-7 7" />
        </g>
      )}
    </motion.g>
  );
}

export default function SystemDesignCanvas({
  graph,
  onChange,
  selectedId,
  onSelect,
  connectingFrom,
  activeNodeId,
  activeEdgeId,
  activePhase,
  activeFlow,
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
  activePhase?: VisualStagePhase;
  activeFlow?: ActiveSystemFlow;
  emphasizedNodeIds?: string[];
  emphasizedEdgeIds?: string[];
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const dragging = useRef<{ id: string; pointerId: number }>();
  const reducedMotion = useReducedMotion() ?? false;
  const rawId = useId().replaceAll(':', '');
  const gridId = `system-grid-${rawId}`;
  const failurePatternId = `system-failure-${rawId}`;
  const arrowIdleId = `system-arrow-idle-${rawId}`;
  const arrowActiveId = `system-arrow-active-${rawId}`;
  const nodes = new Map(graph.nodes.map((node) => [node.id, node]));
  const emphasizedNodes = new Set(emphasizedNodeIds);
  const emphasizedEdges = new Set(emphasizedEdgeIds);
  const phaseVisual = activePhase
    ? SYSTEM_PHASE_VISUALS[activePhase]
    : undefined;

  function stopDragging(pointerId: number) {
    if (dragging.current?.pointerId !== pointerId) return;
    if (svgRef.current?.hasPointerCapture(pointerId))
      svgRef.current.releasePointerCapture(pointerId);
    dragging.current = undefined;
  }

  function move(event: React.PointerEvent<SVGSVGElement>) {
    const current = dragging.current;
    if (!current || event.pointerId !== current.pointerId || !svgRef.current)
      return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = Math.max(
      76,
      Math.min(924, ((event.clientX - rect.left) / rect.width) * 1000),
    );
    const y = Math.max(
      76,
      Math.min(484, ((event.clientY - rect.top) / rect.height) * 560),
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
    <section className="border-y border-line-strong bg-canvas">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
        <div>
          <p className="eyebrow">Semantic system topology</p>
          <p className="mt-1 text-xs text-subtle">
            Shape identifies responsibility; path pattern identifies flow.
          </p>
        </div>
        <p
          className="font-mono text-[10px] uppercase tracking-[.16em] text-ink"
          aria-live="polite"
        >
          {phaseVisual
            ? `${phaseVisual.symbol} ${phaseVisual.label}`
            : '○ inspect topology'}
        </p>
      </div>

      <div className="overflow-x-auto overscroll-x-contain">
        <div className="min-w-[820px]">
          <div className="grid grid-cols-4 divide-x divide-line border-b border-line px-3 py-2">
            {SYSTEM_CANVAS_LANES.map((lane, index) => (
              <div key={lane.id} className="px-3">
                <p className="font-mono text-[8px] uppercase tracking-[.18em] text-subtle">
                  {String(index + 1).padStart(2, '0')} · {lane.label}
                </p>
                <p className="mt-1 text-[9px] text-faint">{lane.detail}</p>
              </div>
            ))}
          </div>

          <svg
            ref={svgRef}
            viewBox="0 0 1000 560"
            className="block w-full min-w-[820px] touch-pan-x"
            aria-label="Editable semantic system architecture canvas"
            onPointerMove={move}
            onPointerUp={(event) => stopDragging(event.pointerId)}
            onPointerCancel={(event) => stopDragging(event.pointerId)}
          >
            <defs>
              <pattern
                id={gridId}
                width="32"
                height="32"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M32 0H0V32"
                  fill="none"
                  stroke="rgb(var(--color-line))"
                  strokeWidth="1"
                  opacity=".45"
                />
              </pattern>
              <pattern
                id={failurePatternId}
                width="8"
                height="8"
                patternUnits="userSpaceOnUse"
                patternTransform="rotate(45)"
              >
                <line
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="8"
                  stroke="rgb(var(--color-ink))"
                  strokeWidth="2"
                  opacity=".16"
                />
              </pattern>
              <marker
                id={arrowIdleId}
                viewBox="0 0 10 10"
                refX="9"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path
                  d="M0 0 10 5 0 10Z"
                  fill="rgb(var(--color-line-strong))"
                />
              </marker>
              <marker
                id={arrowActiveId}
                viewBox="0 0 10 10"
                refX="9"
                refY="5"
                markerWidth="7"
                markerHeight="7"
                orient="auto-start-reverse"
              >
                <path d="M0 0 10 5 0 10Z" fill="rgb(var(--color-ink))" />
              </marker>
            </defs>

            <rect width="1000" height="560" fill={`url(#${gridId})`} />
            {[140, 280, 420].map((y) => (
              <line
                key={y}
                x1="0"
                y1={y}
                x2="1000"
                y2={y}
                stroke="rgb(var(--color-line-strong))"
                strokeDasharray="2 10"
                opacity=".35"
              />
            ))}
            {SYSTEM_CANVAS_LANES.map((lane, index) => (
              <text
                key={lane.id}
                x="18"
                y={22 + index * 140}
                fill="rgb(var(--color-faint))"
                fontSize="8"
                letterSpacing="1.4"
              >
                {lane.label.toUpperCase()}
              </text>
            ))}

            {graph.edges.map((edge) => {
              const from = nodes.get(edge.from);
              const to = nodes.get(edge.to);
              if (!from || !to) return null;
              const active = edge.id === activeEdgeId;
              const emphasized = emphasizedEdges.has(edge.id);
              const parallel = parallelEdgePosition(graph.edges, edge);
              const geometry = buildSystemEdgeGeometry(
                from,
                to,
                parallel.index,
                parallel.count,
              );
              const edgeClass = classifySystemEdge(
                edge,
                from,
                to,
                active ? activeFlow : undefined,
                active || emphasized ? activePhase : undefined,
              );
              const visual = SYSTEM_EDGE_VISUALS[edgeClass];
              const stroke =
                active || emphasized
                  ? 'rgb(var(--color-ink))'
                  : 'rgb(var(--color-line-strong))';
              const staticTokenPoint =
                activePhase === 'initial'
                  ? geometry.start
                  : activePhase === 'terminal'
                    ? geometry.end
                    : geometry.middle;
              const animateToken =
                active &&
                !reducedMotion &&
                activePhase !== 'failure' &&
                activePhase !== 'terminal' &&
                activePhase !== 'initial';
              const visibleLabel =
                edge.label || (active ? visual.label : undefined);
              const displayedLabel = visibleLabel
                ? visibleLabel.trim().toLowerCase() ===
                  visual.label.toLowerCase()
                  ? visibleLabel
                  : `${visibleLabel} · ${visual.label}`
                : undefined;
              return (
                <g key={edge.id}>
                  <title>{`${from.label} to ${to.label} · ${visual.label}${activePhase ? ` · ${SYSTEM_PHASE_VISUALS[activePhase].label}` : ''}`}</title>
                  <path
                    d={geometry.path}
                    fill="none"
                    stroke="rgb(var(--color-canvas))"
                    strokeWidth={visual.width + (active ? 6 : 4)}
                    opacity=".9"
                  />
                  <path
                    d={geometry.path}
                    fill="none"
                    stroke={stroke}
                    strokeWidth={
                      visual.width + (active ? 1.8 : emphasized ? 1 : 0)
                    }
                    strokeDasharray={visual.dasharray}
                    strokeLinecap="round"
                    markerEnd={`url(#${active || emphasized ? arrowActiveId : arrowIdleId})`}
                  />
                  {active && !reducedMotion && activePhase === 'recovery' && (
                    <motion.path
                      d={geometry.path}
                      fill="none"
                      stroke="rgb(var(--color-ink))"
                      strokeWidth="1.5"
                      pathLength="1"
                      initial={{ pathLength: 0, opacity: 0.4 }}
                      animate={{ pathLength: 1, opacity: 1 }}
                      transition={{ duration: 1.1, repeat: Infinity }}
                    />
                  )}
                  {displayedLabel && (
                    <text
                      x={geometry.label.x}
                      y={geometry.label.y}
                      textAnchor="middle"
                      fill={
                        active || emphasized
                          ? 'rgb(var(--color-ink))'
                          : 'rgb(var(--color-subtle))'
                      }
                      stroke="rgb(var(--color-canvas))"
                      strokeWidth="5"
                      paintOrder="stroke"
                      fontSize="9"
                      fontWeight={active ? '700' : '500'}
                      letterSpacing=".8"
                    >
                      {displayedLabel.toUpperCase()}
                    </text>
                  )}
                  {animateToken ? (
                    <MovingFlowToken
                      start={geometry.start}
                      middle={geometry.middle}
                      end={geometry.end}
                      visual={visual}
                    />
                  ) : (
                    active && (
                      <FlowToken
                        point={staticTokenPoint}
                        visual={visual}
                        stroke="rgb(var(--color-ink))"
                      />
                    )
                  )}
                </g>
              );
            })}

            {graph.nodes.map((node) => {
              const active = node.id === activeNodeId;
              const emphasized = emphasizedNodes.has(node.id);
              return (
                <SystemNodeGlyph
                  key={node.id}
                  node={node}
                  active={active}
                  selected={node.id === selectedId}
                  emphasized={emphasized}
                  connecting={node.id === connectingFrom}
                  phase={active || emphasized ? activePhase : undefined}
                  reducedMotion={reducedMotion}
                  failurePatternId={failurePatternId}
                  onSelect={() => onSelect(node.id)}
                  onPointerDown={(event) => {
                    event.stopPropagation();
                    onSelect(node.id);
                    dragging.current = {
                      id: node.id,
                      pointerId: event.pointerId,
                    };
                    svgRef.current?.setPointerCapture(event.pointerId);
                  }}
                />
              );
            })}
          </svg>
        </div>
      </div>
    </section>
  );
}
