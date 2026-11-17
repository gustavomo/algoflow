'use client';

import { LayoutGroup, motion, useReducedMotion } from 'framer-motion';
import type {
  ConceptFlowNarrative,
  ConceptFlowStep,
} from '@algoflow/contracts';
import { VISUAL_STAGE_PHASES } from '@algoflow/contracts';
import { INSTANT, MOVE } from '../../lib/animation/runtimeSceneMotion';
import {
  conceptNodeState,
  splitConceptConnections,
  type ConceptNodeState,
} from '../../lib/animation/conceptFlowLayout';

const PHASE_CLASS: Record<ConceptFlowStep['phase'], string> = {
  initial: 'text-warning',
  transition: 'text-warning',
  failure: 'text-danger',
  recovery: 'text-success',
  terminal: 'text-success',
};

const NODE_CLASS: Record<ConceptNodeState, string> = {
  active: 'border-ink bg-surface-raised',
  failed: 'border-dashed border-danger bg-danger-muted',
  completed: 'border-line-strong bg-surface',
  pending: 'border-line bg-transparent',
};

const BADGE_CLASS: Record<ConceptNodeState, string> = {
  active: 'border-ink bg-ink text-canvas',
  failed: 'border-danger text-danger',
  completed: 'border-success text-success',
  pending: 'border-line-strong text-faint',
};

const TOKEN_CLASS = {
  neutral: 'border-warning bg-warning-muted',
  ok: 'border-success bg-success-muted',
  error: 'border-danger bg-danger-muted',
} as const;

/**
 * A concept as a vertical rail of responsibilities, at every width: a phone
 * reads it top to bottom, and from `sm` up the narration sits beside it. One
 * token travels the rail and carries what the idea has become at each step.
 */
export default function ConceptFlowViz({
  narrative,
  step,
}: {
  narrative: ConceptFlowNarrative;
  step: ConceptFlowStep;
}) {
  const reduced = Boolean(useReducedMotion());
  const transition = reduced ? INSTANT : MOVE;
  const activeConnections = new Set(step.activeConnectionIndexes ?? []);
  const { forward, returns } = splitConceptConnections(narrative);
  const labelOf = new Map(narrative.nodes.map((node) => [node.id, node.label]));
  const stepIndex = narrative.steps.indexOf(step);

  return (
    <section
      className="border-y border-line bg-surface/40 py-3 sm:py-5"
      data-viz="concept-flow"
      data-complete={step.phase === 'terminal' || undefined}
    >
      <header className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-1">
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-muted sm:text-[10px] sm:tracking-[0.26em]">
          {narrative.scene.replaceAll('-', ' ')}
        </p>
        <span
          data-phase={step.phase}
          className={`font-mono text-xs uppercase tracking-[0.12em] sm:text-[10px] sm:tracking-[0.2em] ${PHASE_CLASS[step.phase]}`}
        >
          {step.phase}
        </span>
      </header>
      <p className="mt-2 px-1 text-sm font-semibold leading-5 text-ink">
        {stepIndex >= 0 && (
          <span className="mr-2 font-mono text-xs font-normal text-subtle">
            {stepIndex + 1}/{narrative.steps.length}
          </span>
        )}
        {step.label}
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,17rem)_minmax(0,1fr)] sm:gap-5">
        <LayoutGroup id="concept-flow">
          <ol data-concept-rail className="min-w-0">
            {narrative.nodes.map((node, index) => {
              const state = conceptNodeState(step, node.id);
              const holdsToken = step.token?.nodeId === node.id;
              const incoming = forward[index - 1];
              return (
                <li key={node.id}>
                  {index > 0 && (
                    <span
                      aria-hidden
                      data-connection={
                        incoming && activeConnections.has(incoming.index)
                          ? 'active'
                          : 'idle'
                      }
                      className={`ml-[1.1rem] block h-3 w-0.5 transition-colors duration-300 ${incoming && activeConnections.has(incoming.index) ? 'bg-ink' : 'bg-line-strong'}`}
                    />
                  )}
                  <div
                    data-node={node.id}
                    data-node-state={state}
                    aria-current={state === 'active' ? 'step' : undefined}
                    className={`flex items-start gap-2.5 rounded-lg border px-2 py-2 transition-[background-color,border-color,opacity] duration-300 ${NODE_CLASS[state]} ${state === 'pending' ? 'opacity-60' : ''}`}
                  >
                    <span
                      aria-hidden
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border font-mono text-xs transition-colors duration-300 ${BADGE_CLASS[state]}`}
                    >
                      {state === 'completed'
                        ? '✓'
                        : state === 'failed'
                          ? '✗'
                          : index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-sm leading-6 ${state === 'pending' ? 'text-subtle' : 'font-semibold text-ink'}`}
                      >
                        {node.label}
                        {state === 'failed' && (
                          <span className="sr-only"> (failed)</span>
                        )}
                        {state === 'completed' && (
                          <span className="sr-only"> (done)</span>
                        )}
                      </p>
                      {node.detail && (
                        // Phones only spell out the node the idea is at.
                        <p
                          className={`text-xs leading-5 text-subtle ${holdsToken || state === 'active' ? '' : 'hidden sm:block'}`}
                        >
                          {node.detail}
                        </p>
                      )}
                      {holdsToken && step.token && (
                        <motion.p
                          layoutId="concept-token"
                          layout="position"
                          data-concept-token={step.token.tone ?? 'neutral'}
                          transition={transition}
                          className={`mt-1.5 inline-block max-w-full rounded-md border px-2 py-1 font-mono text-xs leading-5 text-ink shadow-sm [overflow-wrap:anywhere] ${TOKEN_CLASS[step.token.tone ?? 'neutral']}`}
                        >
                          <span className="sr-only">Now: </span>
                          {step.token.label}
                        </motion.p>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
            {returns.map(({ connection, index }) => (
              <li
                key={`return-${index}`}
                data-connection={
                  activeConnections.has(index) ? 'active' : 'idle'
                }
                className={`mt-2 rounded-lg border border-dashed px-2 py-1.5 text-xs leading-5 transition-colors duration-300 ${activeConnections.has(index) ? 'border-success text-ink' : 'border-line-strong text-subtle'}`}
              >
                <span aria-hidden className="mr-1.5 font-mono">
                  ↺
                </span>
                {labelOf.get(connection.from)} → {labelOf.get(connection.to)}
                {connection.label ? `: ${connection.label}` : ''}
              </li>
            ))}
          </ol>
        </LayoutGroup>
        <div className="min-w-0">
          <ol
            aria-hidden
            className="grid grid-cols-5 border-y border-line py-2 text-center font-mono text-[11px] uppercase tracking-tight text-faint sm:text-[10px]"
          >
            {VISUAL_STAGE_PHASES.map((phase) => (
              <li
                key={phase}
                className={step.phase === phase ? 'text-ink' : undefined}
              >
                {phase}
              </li>
            ))}
          </ol>
          <div aria-live="polite" className="px-1 pt-3">
            {step.metric && (
              <p className="font-mono text-xs uppercase tracking-[0.12em] text-warning sm:text-[10px] sm:tracking-[0.2em]">
                {step.metric}
              </p>
            )}
            <p className="mt-2 text-sm leading-6 text-ink-soft sm:min-h-[9rem]">
              {step.narration}
            </p>
            {step.phase === 'terminal' && (
              <p className="mt-3 border-l-2 border-success pl-3 text-sm leading-6 text-ink-soft">
                {narrative.terminalSummary}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
