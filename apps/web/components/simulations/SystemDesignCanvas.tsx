'use client';

import { useId, useRef, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { useHydratedReducedMotion } from '../../lib/animation/useHydratedReducedMotion';
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
} from '../../lib/simulations/visualGrammar';
import {
  TRACE_TONE_VAR,
  tokenTravel,
  type TraceFrame,
} from '../../lib/simulations/flowTrace';
import { tone } from '../../lib/animation/runtimeSceneTone';
import SystemNodeGlyph from './SystemNodeGlyph';

/**
 * The one request token: it keeps its identity across steps and travels from
 * the previous node along the drawn edge to the current one, carrying the
 * step's tone and the latency accumulated so far. With reduced motion, when
 * stepping backwards or when the topology moves under it, it jumps instead.
 */
function RequestToken({
  frame,
  graph,
  stepIndex,
  durationMs,
  shape,
  reducedMotion,
}: {
  frame: TraceFrame;
  graph: SystemDesignGraph;
  stepIndex: number;
  durationMs: number;
  shape: SystemEdgeVisualSpec['token'];
  reducedMotion: boolean;
}) {
  const travel = useRef<{ step: number; at: number; moving: boolean }>();
  const now = Date.now();
  if (travel.current?.step !== stepIndex) {
    travel.current = {
      step: stepIndex,
      at: now,
      moving:
        !reducedMotion &&
        travel.current !== undefined &&
        stepIndex === travel.current.step + 1,
    };
  }
  const points = tokenTravel(frame, graph);
  const rest = points.at(-1);
  if (!rest) return null;
  const moving =
    travel.current.moving &&
    points.length > 1 &&
    now - travel.current.at < durationMs;
  const color = tone(TRACE_TONE_VAR[frame.tone]);
  return (
    <motion.g
      data-request-token={frame.tone}
      aria-hidden="true"
      pointerEvents="none"
      initial={false}
      animate={
        moving
          ? {
              x: points.map((point) => point.x),
              y: points.map((point) => point.y),
            }
          : { x: rest.x, y: rest.y }
      }
      transition={
        moving
          ? { duration: durationMs / 1000, ease: 'easeInOut' }
          : { duration: 0 }
      }
    >
      <circle
        r="12"
        fill="rgb(var(--color-canvas))"
        stroke={color}
        strokeWidth="2.5"
      />
      {shape === 'square' && (
        <rect x="-5" y="-5" width="10" height="10" fill={color} />
      )}
      {shape === 'diamond' && <path d="M0-7 7 0 0 7-7 0Z" fill={color} />}
      {shape === 'double' && (
        <g fill={color}>
          <circle cx="-4" r="3.5" />
          <circle cx="4" r="3.5" />
        </g>
      )}
      {shape === 'cross' && (
        <path
          d="M-5-5 5 5M5-5-5 5"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
        />
      )}
      {shape === 'circle' && <circle r="5.5" fill={color} />}
      <text
        y="-19"
        textAnchor="middle"
        fill={color}
        stroke="rgb(var(--color-canvas))"
        strokeWidth="4"
        paintOrder="stroke"
        fontSize="11"
        fontWeight="700"
      >
        {`${frame.totalMs}ms`}
      </text>
    </motion.g>
  );
}

/**
 * Marks the final step: a success outline over the canvas plus one light
 * sweep across it. With reduced motion only the static outline is drawn.
 */
function CompletionSweep({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <div
      aria-hidden
      data-completion={reducedMotion ? 'static' : 'sweep'}
      className="pointer-events-none absolute inset-0 overflow-hidden border-2"
      style={{
        borderColor: tone('--color-success', 0.55),
        boxShadow: `inset 0 0 0 3px ${tone('--color-success', 0.1)}`,
      }}
    >
      {!reducedMotion && (
        <motion.div
          className="absolute inset-y-0 w-1/3"
          style={{
            background: `linear-gradient(90deg, transparent, ${tone('--color-success', 0.18)}, transparent)`,
          }}
          initial={{ left: '-35%' }}
          animate={{ left: '105%' }}
          transition={{ duration: 0.9, ease: 'easeInOut' }}
        />
      )}
    </div>
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
  trace,
  complete = false,
  footer,
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
  /** The request token for the current step, when a flow or trace is set. */
  trace?: { frame: TraceFrame; stepIndex: number; durationMs: number };
  /** The flow reached its last step: draw the completion sweep. */
  complete?: boolean;
  /** Controls docked to the canvas bottom (narration, caption, playback). */
  footer?: ReactNode;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const dragging = useRef<{ id: string; pointerId: number }>();
  const reducedMotion = useHydratedReducedMotion();
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
  const tokenEdge = trace?.frame.edgeId
    ? graph.edges.find((edge) => edge.id === trace.frame.edgeId)
    : undefined;
  const tokenEdgeFrom = tokenEdge ? nodes.get(tokenEdge.from) : undefined;
  const tokenEdgeTo = tokenEdge ? nodes.get(tokenEdge.to) : undefined;
  const tokenShape =
    tokenEdge && tokenEdgeFrom && tokenEdgeTo
      ? SYSTEM_EDGE_VISUALS[
          classifySystemEdge(
            tokenEdge,
            tokenEdgeFrom,
            tokenEdgeTo,
            activeFlow,
            activePhase,
          )
        ].token
      : 'circle';

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
    // Map through the screen matrix so letterboxing and zoom stay exact.
    const matrix = svgRef.current.getScreenCTM();
    if (!matrix) return;
    const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(
      matrix.inverse(),
    );
    const x = Math.max(76, Math.min(924, point.x));
    const y = Math.max(76, Math.min(484, point.y));
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
        <div className="relative min-w-[820px]">
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
            className="block max-h-[calc(100svh-17rem)] min-h-[300px] w-full min-w-[820px] touch-pan-x"
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

            {trace && (
              <RequestToken
                frame={trace.frame}
                graph={graph}
                stepIndex={trace.stepIndex}
                durationMs={trace.durationMs}
                shape={tokenShape}
                reducedMotion={reducedMotion}
              />
            )}
          </svg>
          {complete && <CompletionSweep reducedMotion={reducedMotion} />}
        </div>
      </div>
      {footer}
    </section>
  );
}
