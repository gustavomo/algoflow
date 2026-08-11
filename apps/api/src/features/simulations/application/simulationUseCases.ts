import type {
  ReviewState,
  SystemChallengeRunRequest,
  SystemDesignAttempt,
  SystemDesignDraft,
  SystemDesignGraph,
} from '@algoflow/contracts';
import type { ReviewRepository } from '../../review/ports/reviewRepository';
import { scenarioBySlug, systemDesignScenarios } from '../domain/scenarios';
import {
  getChallengeForScenario,
  runDesignChallenge,
} from '../domain/challenges';
import {
  evaluateSystemDesign,
  validatedProposal,
  validateSystemGraph,
} from '../domain/systemDesign';
import type { DesignProposalProvider } from '../ports/designProposalProvider';
import type { SimulationRepository } from '../ports/simulationRepository';

export async function getSimulationCatalog(repository: SimulationRepository) {
  const attempts = await repository.listAttempts();
  return Promise.all(
    systemDesignScenarios.map(async (scenario) => ({
      scenario,
      draft: await repository.getDraft(scenario.slug),
      latestAttempt: attempts.find(
        (attempt) => attempt.scenarioSlug === scenario.slug,
      ),
    })),
  );
}

export async function getSimulationWorkspace(
  repository: SimulationRepository,
  scenarioSlug: string,
) {
  const scenario = scenarioBySlug.get(scenarioSlug);
  if (!scenario) return undefined;
  return {
    scenario,
    challenge: getChallengeForScenario(scenarioSlug),
    draft: await repository.getDraft(scenarioSlug),
    attempts: await repository.listAttempts(scenarioSlug),
  };
}

export function runSimulationChallenge(input: SystemChallengeRunRequest) {
  if (!scenarioBySlug.has(input.scenarioSlug))
    return { missing: true as const, error: 'Scenario not found.' };
  return runDesignChallenge(input);
}

export async function saveSimulationDraft(
  repository: SimulationRepository,
  input: { scenarioSlug: string; name: string; graph: SystemDesignGraph },
) {
  if (!scenarioBySlug.has(input.scenarioSlug))
    return { error: 'Scenario not found.', missing: true as const };
  const errors = validateSystemGraph(input.graph);
  const name = input.name?.trim();
  if (!name || name.length > 100)
    errors.push('Draft name is required and must be at most 100 characters.');
  if (errors.length) return { error: errors.join(' ') };
  const current = await repository.getDraft(input.scenarioSlug);
  const draft: SystemDesignDraft = {
    id: current?.id ?? crypto.randomUUID(),
    scenarioSlug: input.scenarioSlug,
    name,
    graph: input.graph,
    updatedAt: new Date().toISOString(),
  };
  return { value: await repository.saveDraft(draft) };
}

export async function evaluateSimulation(
  repository: SimulationRepository,
  reviews: ReviewRepository,
  input: { scenarioSlug: string; graph: SystemDesignGraph; tradeOffs: string },
  now = new Date(),
) {
  const scenario = scenarioBySlug.get(input.scenarioSlug);
  if (!scenario)
    return { missing: true as const, error: 'Scenario not found.' };
  const errors = validateSystemGraph(input.graph);
  if (!input.tradeOffs?.trim() || input.tradeOffs.trim().length < 20)
    errors.push('Explain at least one trade-off in 20 characters or more.');
  if (errors.length) return { error: errors.join(' ') };
  const evaluation = evaluateSystemDesign(
    scenario,
    input.graph,
    input.tradeOffs,
  );
  const attempt: SystemDesignAttempt = {
    id: crypto.randomUUID(),
    scenarioSlug: scenario.slug,
    scenarioVersion: scenario.version,
    graph: input.graph,
    tradeOffs: input.tradeOffs.trim(),
    evaluation,
    createdAt: now.toISOString(),
  };
  await repository.saveAttempt(attempt);
  const tomorrow = new Date(now.getTime() + 86_400_000).toISOString();
  for (const item of evaluation.evidence.filter(
    (evidence) => !evidence.passed,
  )) {
    const rule = scenario.rubric.find(
      (candidate) => candidate.id === item.ruleId,
    )!;
    const conceptId = `simulation:${scenario.slug}:${item.conceptId}`;
    const existing = await reviews.getReview(conceptId);
    const review: ReviewState = {
      conceptId,
      sourceType: 'simulation-rubric',
      sourceId: `${scenario.slug}:${rule.id}`,
      title: `${scenario.title} · ${rule.title}`,
      prompt: rule.reviewPrompt,
      answer: rule.reviewAnswer,
      intervalDays: existing?.intervalDays ?? 1,
      easeFactor: existing?.easeFactor ?? 2.5,
      repetitions: existing?.repetitions ?? 0,
      lapses: (existing?.lapses ?? 0) + 1,
      dueAt: existing && existing.dueAt < tomorrow ? existing.dueAt : tomorrow,
      lastReviewedAt: existing?.lastReviewedAt,
    };
    await reviews.saveReview(review);
  }
  return { value: attempt };
}

export async function proposeSimulationDesign(
  provider: DesignProposalProvider,
  input: {
    scenarioSlug: string;
    graph: SystemDesignGraph;
    question?: string;
    phaseId?: string;
    signal?: AbortSignal;
  },
) {
  const scenario = scenarioBySlug.get(input.scenarioSlug);
  if (!scenario)
    return { missing: true as const, error: 'Scenario not found.' };
  const errors = validateSystemGraph(input.graph);
  if (errors.length) return { error: errors.join(' ') };
  const phase = input.phaseId
    ? scenario.phases?.find((candidate) => candidate.id === input.phaseId)
    : undefined;
  if (input.phaseId && !phase)
    return { error: 'The selected migration phase is not available.' };
  const output = await provider.propose({
    scenario,
    graph: input.graph,
    question: input.question,
    phase,
    signal: input.signal,
  });
  const proposal = validatedProposal(
    input.graph,
    output.operations,
    output.rationale,
    {
      provider: provider.provider,
      model: provider.model,
      effort: provider.effort,
    },
  );
  return proposal
    ? { value: proposal }
    : { error: 'The provider returned an invalid design patch.' };
}
