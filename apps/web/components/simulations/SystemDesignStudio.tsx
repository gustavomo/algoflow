'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMachine } from '@xstate/react';
import {
  SYSTEM_NODE_TYPES,
  type AIProviderSelection,
  type DesignProposal,
  type SystemChallengeDefinition,
  type SystemChallengeRunResult,
  type SystemChallengeStep,
  type SystemDesignAttempt,
  type SystemDesignDraft,
  type SystemDesignGraph,
  type SystemDesignScenario,
  type SystemNodeType,
  type TutorOverlay,
} from '@algoflow/contracts';
import playbackMachine from '../../lib/xstate/playbackMachine';
import { createSystemFlowSteps } from '../../lib/simulations/flowSteps';
import PlaybackBar from '../animation/PlaybackBar';
import ProviderControls from '../ai/ProviderControls';
import SystemDesignCanvas from './SystemDesignCanvas';
import DesignChallengePanel from './DesignChallengePanel';
import TutorPanel from '../tutor/TutorPanel';

const nodeLabel = (type: SystemNodeType) =>
  type.replaceAll('-', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

const booleanConfigKeys = [
  ['tls', 'TLS'],
  ['durable', 'Durable'],
  ['healthChecks', 'Health checks'],
  ['replication', 'Replication'],
  ['validated', 'Validated'],
  ['rollbackReady', 'Rollback ready'],
  ['idempotent', 'Idempotent'],
  ['multiRegion', 'Multi-region'],
] as const;

export default function SystemDesignStudio({
  scenario,
  challenge,
  draft,
  initialAttempts,
}: {
  scenario: SystemDesignScenario;
  challenge?: SystemChallengeDefinition;
  draft?: SystemDesignDraft;
  initialAttempts: SystemDesignAttempt[];
}) {
  const initialPhase = scenario.phases?.[0];
  const [graph, setGraph] = useState<SystemDesignGraph>(() =>
    structuredClone(draft?.graph ?? scenario.initialGraph),
  );
  const [selectedId, setSelectedId] = useState<string>();
  const [connectingFrom, setConnectingFrom] = useState<string>();
  const [blockType, setBlockType] = useState<SystemNodeType>('service');
  const [draftName, setDraftName] = useState(draft?.name ?? 'My architecture');
  const [phaseId, setPhaseId] = useState(initialPhase?.id ?? '');
  const [flowId, setFlowId] = useState(
    initialPhase?.flowIds[0] ?? scenario.flows[0]?.id ?? '',
  );
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [proposal, setProposal] = useState<DesignProposal>();
  const [providerSelection, setProviderSelection] =
    useState<AIProviderSelection>();
  const [tradeOffs, setTradeOffs] = useState('');
  const [attempts, setAttempts] = useState(initialAttempts);
  const [challengeResult, setChallengeResult] =
    useState<SystemChallengeRunResult>();
  const [challengeStep, setChallengeStep] = useState<SystemChallengeStep>();
  const [tutorOverlay, setTutorOverlay] = useState<TutorOverlay>();
  const [state, send] = useMachine(playbackMachine);
  const currentPhase = scenario.phases?.find((phase) => phase.id === phaseId);
  const availableFlows = useMemo(() => {
    if (!currentPhase) return scenario.flows;
    const allowed = new Set(currentPhase.flowIds);
    return scenario.flows.filter((flow) => allowed.has(flow.id));
  }, [currentPhase, scenario.flows]);
  const flow = useMemo(
    () => createSystemFlowSteps(scenario, graph, flowId),
    [flowId, graph, scenario],
  );
  const currentStep =
    flow.steps[
      Math.min(state.context.stepIndex, Math.max(0, flow.steps.length - 1))
    ];
  const selected = graph.nodes.find((node) => node.id === selectedId);
  const selectedEdges = graph.edges.filter(
    (edge) => edge.from === selectedId || edge.to === selectedId,
  );
  const updateChallengeResult = useCallback(
    (result?: SystemChallengeRunResult) => setChallengeResult(result),
    [],
  );
  const updateChallengeStep = useCallback(
    (step?: SystemChallengeStep) => setChallengeStep(step),
    [],
  );
  const updateTutorOverlay = useCallback(
    (overlay?: TutorOverlay) => setTutorOverlay(overlay),
    [],
  );
  const tutorContext = useMemo(
    () => ({
      kind: 'design-lab' as const,
      scenarioSlug: scenario.slug,
      phaseId: currentPhase?.id,
      graph,
      selectedNodeId: selectedId,
      challengeResult,
      failedRuleIds: attempts[0]?.evaluation.evidence
        .filter((item) => !item.passed)
        .map((item) => item.ruleId),
    }),
    [
      attempts,
      challengeResult,
      currentPhase?.id,
      graph,
      scenario.slug,
      selectedId,
    ],
  );
  const tutorNodeIds =
    tutorOverlay?.kind === 'highlight-system' ? tutorOverlay.nodeIds : [];
  const tutorEdgeIds =
    tutorOverlay?.kind === 'highlight-system' ? tutorOverlay.edgeIds : [];

  useEffect(() => {
    if (!availableFlows.some((candidate) => candidate.id === flowId))
      setFlowId(availableFlows[0]?.id ?? '');
  }, [availableFlows, flowId]);

  useEffect(() => {
    send({ type: 'SETUP', totalSteps: Math.max(1, flow.steps.length) });
  }, [flow.steps.length, send]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.isContentEditable ||
          ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(target.tagName))
      )
        return;
      if ((event.key === 'Delete' || event.key === 'Backspace') && selectedId) {
        event.preventDefault();
        removeSelected();
        return;
      }
      if (
        event.altKey &&
        selectedId &&
        ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)
      ) {
        event.preventDefault();
        const dx =
          event.key === 'ArrowLeft' ? -20 : event.key === 'ArrowRight' ? 20 : 0;
        const dy =
          event.key === 'ArrowUp' ? -20 : event.key === 'ArrowDown' ? 20 : 0;
        nudge(dx, dy);
        return;
      }
      if (event.code === 'Space') {
        event.preventDefault();
        send({ type: state.matches('playing') ? 'PAUSE' : 'PLAY' });
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        send({ type: 'PREV' });
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        send({ type: 'NEXT' });
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  function addBlock() {
    const sequence = graph.nodes.length + 1;
    const id = `${blockType}-${Date.now().toString(36)}`;
    setGraph({
      ...graph,
      nodes: [
        ...graph.nodes,
        {
          id,
          type: blockType,
          label: nodeLabel(blockType),
          x: 120 + ((sequence * 155) % 760),
          y: 100 + ((Math.floor(sequence / 5) * 130) % 360),
          config: {},
        },
      ],
    });
    setSelectedId(id);
    setMessage(
      `${nodeLabel(blockType)} added. Drag it or use Alt + arrow keys.`,
    );
  }

  function selectNode(id: string) {
    if (connectingFrom && connectingFrom !== id) {
      const duplicate = graph.edges.some(
        (edge) => edge.from === connectingFrom && edge.to === id,
      );
      if (duplicate) setMessage('Those blocks are already connected.');
      else
        setGraph({
          ...graph,
          edges: [
            ...graph.edges,
            {
              id: `edge-${Date.now().toString(36)}`,
              from: connectingFrom,
              to: id,
            },
          ],
        });
      setConnectingFrom(undefined);
    }
    setSelectedId(id);
  }

  function removeSelected() {
    if (!selectedId) return;
    setGraph({
      nodes: graph.nodes.filter((node) => node.id !== selectedId),
      edges: graph.edges.filter(
        (edge) => edge.from !== selectedId && edge.to !== selectedId,
      ),
    });
    setSelectedId(undefined);
    setConnectingFrom(undefined);
    setMessage('Block and incident connections removed.');
  }

  function updateSelected(changes: {
    label?: string;
    config?: Record<string, string | number | boolean>;
  }) {
    if (!selectedId) return;
    setGraph({
      ...graph,
      nodes: graph.nodes.map((node) =>
        node.id === selectedId
          ? {
              ...node,
              label: changes.label ?? node.label,
              config: changes.config
                ? { ...node.config, ...changes.config }
                : node.config,
            }
          : node,
      ),
    });
  }

  function nudge(dx: number, dy: number) {
    if (!selectedId) return;
    setGraph({
      ...graph,
      nodes: graph.nodes.map((node) =>
        node.id === selectedId
          ? {
              ...node,
              x: Math.max(70, Math.min(930, node.x + dx)),
              y: Math.max(50, Math.min(510, node.y + dy)),
            }
          : node,
      ),
    });
  }

  function updateEdgeLabel(edgeId: string, label: string) {
    setGraph({
      ...graph,
      edges: graph.edges.map((edge) =>
        edge.id === edgeId
          ? { ...edge, label: label.trimStart() || undefined }
          : edge,
      ),
    });
  }

  async function request(path: string, body: unknown) {
    const response = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const payload = await response.json();
    if (!response.ok)
      throw new Error(payload.error?.message || 'The request failed.');
    return payload;
  }

  async function saveDraft() {
    setLoading(true);
    setMessage('');
    try {
      await request('/api/simulations/draft', {
        scenarioSlug: scenario.slug,
        name: draftName,
        graph,
      });
      setMessage('Draft saved on the server.');
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'Could not save draft.',
      );
    } finally {
      setLoading(false);
    }
  }

  async function askForProposal() {
    setLoading(true);
    setMessage('');
    setProposal(undefined);
    try {
      const body = await request('/api/simulations/proposal', {
        scenarioSlug: scenario.slug,
        graph,
        phaseId: currentPhase?.id,
        ...providerSelection,
      });
      setProposal(body.proposal);
      setMessage('Proposal ready. Preview it before applying.');
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'Could not propose a change.',
      );
    } finally {
      setLoading(false);
    }
  }

  async function evaluate() {
    setLoading(true);
    setMessage('');
    try {
      const body = await request('/api/simulations/evaluate', {
        scenarioSlug: scenario.slug,
        graph,
        tradeOffs,
      });
      setAttempts((items) => [body.attempt, ...items]);
      setMessage(`Evaluation saved: ${body.attempt.evaluation.score}%.`);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'Could not evaluate design.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="min-w-0 space-y-5">
        <section className="panel p-4">
          <div className="flex flex-wrap items-end gap-3">
            <label className="min-w-52 flex-1 text-xs text-subtle">
              Block type
              <select
                value={blockType}
                onChange={(event) =>
                  setBlockType(event.target.value as SystemNodeType)
                }
                className="field mt-2 w-full px-3 py-2.5 text-sm"
              >
                {SYSTEM_NODE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {nodeLabel(type)}
                  </option>
                ))}
              </select>
            </label>
            <button
              onClick={addBlock}
              className="button-primary px-4 py-2.5 text-sm"
            >
              Add block
            </button>
            <input
              value={draftName}
              onChange={(event) => setDraftName(event.target.value)}
              aria-label="Draft name"
              className="field min-w-52 flex-1 px-3 py-2.5 text-sm"
            />
            <button
              onClick={saveDraft}
              disabled={loading}
              className="button-secondary px-4 py-2.5 text-sm"
            >
              Save draft
            </button>
          </div>
        </section>

        <SystemDesignCanvas
          graph={graph}
          onChange={setGraph}
          selectedId={selectedId}
          onSelect={selectNode}
          connectingFrom={connectingFrom}
          activeNodeId={challengeStep?.nodeId ?? currentStep?.nodeId}
          activeEdgeId={challengeStep?.edgeId ?? currentStep?.edgeId}
          emphasizedNodeIds={[
            ...(challengeResult?.affectedNodeIds ?? []),
            ...tutorNodeIds,
          ]}
          emphasizedEdgeIds={[
            ...(challengeResult?.affectedEdgeIds ?? []),
            ...tutorEdgeIds,
          ]}
        />

        {challenge && (
          <DesignChallengePanel
            definition={challenge}
            graph={graph}
            phaseId={currentPhase?.id}
            onResult={updateChallengeResult}
            onActiveStep={updateChallengeStep}
          />
        )}

        {selected && (
          <section className="panel p-5">
            <div className="flex flex-wrap items-end gap-3">
              <label className="min-w-48 flex-1 text-xs text-subtle">
                Selected label
                <input
                  value={selected.label}
                  onChange={(event) =>
                    updateSelected({ label: event.target.value })
                  }
                  className="field mt-2 w-full px-3 py-2"
                />
              </label>
              <label className="text-xs text-subtle">
                Replicas
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={Number(selected.config.replicas ?? 1)}
                  onChange={(event) =>
                    updateSelected({
                      config: {
                        replicas: Math.max(
                          1,
                          Math.min(50, Number(event.target.value)),
                        ),
                      },
                    })
                  }
                  className="field mt-2 w-24 px-3 py-2"
                />
              </label>
              {booleanConfigKeys.map(([key, label]) => (
                <label
                  key={key}
                  className="flex items-center gap-2 rounded-xl border border-line px-3 py-2.5 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={Boolean(selected.config[key])}
                    onChange={(event) =>
                      updateSelected({
                        config: { [key]: event.target.checked },
                      })
                    }
                  />
                  {label}
                </label>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() => setConnectingFrom(selected.id)}
                className="button-secondary px-3 py-2 text-xs"
              >
                Connect from this block
              </button>
              {[
                ['←', -20, 0],
                ['↑', 0, -20],
                ['↓', 0, 20],
                ['→', 20, 0],
              ].map(([label, dx, dy]) => (
                <button
                  key={String(label)}
                  onClick={() => nudge(Number(dx), Number(dy))}
                  className="button-secondary h-9 w-9 text-sm"
                >
                  {label}
                </button>
              ))}
              <button
                onClick={removeSelected}
                className="rounded-xl border border-danger/40 px-3 py-2 text-xs text-danger"
              >
                Remove block
              </button>
            </div>
            {connectingFrom && (
              <p className="mt-3 text-xs text-warning">
                Select another block to create a directed connection.
              </p>
            )}
            {selectedEdges.length > 0 && (
              <div className="mt-5 border-t border-line pt-4">
                <p className="eyebrow">Connection labels</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {selectedEdges.map((edge) => {
                    const from = graph.nodes.find(
                      (node) => node.id === edge.from,
                    );
                    const to = graph.nodes.find((node) => node.id === edge.to);
                    return (
                      <label key={edge.id} className="text-xs text-subtle">
                        {from?.label} → {to?.label}
                        <input
                          value={edge.label ?? ''}
                          onChange={(event) =>
                            updateEdgeLabel(edge.id, event.target.value)
                          }
                          placeholder="Connection label"
                          maxLength={80}
                          className="field mt-2 w-full px-3 py-2"
                        />
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </section>
        )}

        <section className="panel p-5">
          {scenario.phases && scenario.phases.length > 0 && (
            <div className="mb-5 border-b border-line pb-5">
              <p className="eyebrow">Migration phase</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {scenario.phases.map((phase) => (
                  <button
                    key={phase.id}
                    type="button"
                    onClick={() => setPhaseId(phase.id)}
                    aria-pressed={phase.id === phaseId}
                    className={`rounded-full border px-3 py-2 text-xs transition ${
                      phase.id === phaseId
                        ? 'border-ink bg-ink text-canvas'
                        : 'border-line text-subtle hover:border-line-strong hover:text-ink'
                    }`}
                  >
                    {phase.title}
                  </button>
                ))}
              </div>
              {currentPhase && (
                <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                  <p className="text-ink-soft">{currentPhase.goal}</p>
                  <p className="rounded-xl border border-line bg-canvas/50 p-3 text-subtle">
                    Gate · {currentPhase.gate}
                  </p>
                </div>
              )}
            </div>
          )}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="flex-1 text-xs text-subtle">
              Representative flow
              <select
                value={flowId}
                onChange={(event) => setFlowId(event.target.value)}
                className="field mt-2 w-full px-3 py-2"
              >
                {availableFlows.map((flow) => (
                  <option key={flow.id} value={flow.id}>
                    {flow.title}
                  </option>
                ))}
              </select>
            </label>
            <span className="text-xs text-muted">
              {currentStep?.label ?? 'Flow unavailable'}
            </span>
          </div>
          {flow.error ? (
            <p className="mt-4 rounded-xl border border-warning/30 bg-warning-muted p-4 text-sm text-warning">
              {flow.error}
            </p>
          ) : (
            <p className="mt-4 min-h-12 text-sm leading-6 text-ink-soft">
              {currentStep?.narration}
            </p>
          )}
          <PlaybackBar state={state} send={send} />
        </section>

        <section className="panel p-6">
          <p className="eyebrow">Deterministic evaluation</p>
          <textarea
            value={tradeOffs}
            onChange={(event) => setTradeOffs(event.target.value)}
            maxLength={4000}
            placeholder="Explain latency, availability, consistency, cost, security, or retry trade-offs…"
            className="field mt-4 min-h-28 w-full resize-y px-4 py-3"
          />
          <button
            onClick={evaluate}
            disabled={loading}
            className="button-primary mt-4 px-5 py-3"
          >
            Evaluate final design
          </button>
          {attempts[0] && (
            <div className="mt-6 border-t border-line pt-5">
              <div className="flex items-end justify-between">
                <h3 className="text-3xl font-semibold">
                  {attempts[0].evaluation.score}%
                </h3>
                <span
                  className={
                    attempts[0].evaluation.passed
                      ? 'text-success'
                      : 'text-warning'
                  }
                >
                  {attempts[0].evaluation.passed ? 'Passed' : 'Keep iterating'}
                </span>
              </div>
              <div className="mt-4 space-y-2">
                {attempts[0].evaluation.evidence.map((item) => (
                  <div
                    key={item.ruleId}
                    className="flex gap-3 rounded-xl bg-canvas/60 p-3 text-sm"
                  >
                    <span
                      className={item.passed ? 'text-success' : 'text-danger'}
                    >
                      {item.passed ? '✓' : '×'}
                    </span>
                    <div>
                      <p className="font-medium">{item.title}</p>
                      <p className="mt-1 text-xs leading-5 text-subtle">
                        {item.evidence}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>

      <aside className="space-y-5 xl:sticky xl:top-28 xl:self-start">
        <section className="panel p-5">
          <p className="eyebrow">Requirements</p>
          <ul className="mt-4 space-y-3 text-sm text-ink-soft">
            {scenario.requirements.map((item) => (
              <li key={item}>□ {item}</li>
            ))}
          </ul>
          <p className="mt-5 eyebrow">Constraints</p>
          <ul className="mt-3 space-y-2 text-xs leading-5 text-subtle">
            {scenario.constraints.map((item) => (
              <li key={item}>— {item}</li>
            ))}
          </ul>
        </section>
        <section className="rounded-2xl border border-line-strong bg-surface-raised p-5">
          <p className="eyebrow">AI design partner</p>
          <p className="mt-3 text-sm leading-6 text-muted">
            Requests one constrained patch. It cannot apply or save changes.
          </p>
          <ProviderControls
            idPrefix="design-ai"
            value={providerSelection}
            onChange={setProviderSelection}
            disabled={loading}
          />
          <button
            onClick={askForProposal}
            disabled={loading}
            className="button-secondary mt-4 w-full px-4 py-2.5 text-sm"
          >
            Propose next improvement
          </button>
          {proposal && (
            <div className="mt-5 border-t border-line pt-4">
              <div className="flex items-center justify-between">
                <span className="eyebrow">
                  Preview · {proposal.provider} · {proposal.model}
                  {proposal.effort ? ` · ${proposal.effort}` : ''}
                </span>
                <span className="text-xs text-muted">
                  {proposal.operations.length} ops
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-ink-soft">
                {proposal.rationale}
              </p>
              <ol className="mt-3 space-y-1 text-xs text-subtle">
                {proposal.operations.map((operation, index) => (
                  <li key={index}>
                    {index + 1}. {operation.op}
                  </li>
                ))}
              </ol>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => {
                    setGraph(proposal.previewGraph);
                    setProposal(undefined);
                    setMessage(
                      'Proposal applied locally. Save the draft to persist it.',
                    );
                  }}
                  className="button-primary px-3 py-2 text-xs"
                >
                  Apply preview
                </button>
                <button
                  onClick={() => setProposal(undefined)}
                  className="button-secondary px-3 py-2 text-xs"
                >
                  Reject
                </button>
              </div>
            </div>
          )}
        </section>
        <TutorPanel context={tutorContext} onOverlay={updateTutorOverlay} />
        {message && (
          <p
            role="status"
            className="rounded-xl border border-line bg-surface px-4 py-3 text-sm leading-6 text-muted"
          >
            {message}
          </p>
        )}
        <details className="panel p-5">
          <summary className="cursor-pointer text-sm font-medium">
            Text topology summary
          </summary>
          <ul className="mt-4 space-y-2 text-xs text-subtle">
            {graph.nodes.map((node) => (
              <li key={node.id}>
                {node.label} ({node.type}) →{' '}
                {graph.edges
                  .filter((edge) => edge.from === node.id)
                  .map(
                    (edge) =>
                      graph.nodes.find((target) => target.id === edge.to)
                        ?.label,
                  )
                  .filter(Boolean)
                  .join(', ') || 'no outgoing connection'}
              </li>
            ))}
          </ul>
        </details>
      </aside>
    </div>
  );
}
