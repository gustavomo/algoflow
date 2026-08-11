import type {
  DesignLabScenarioDraft,
  ScenarioDraftDifficulty,
} from '@algoflow/contracts';
import {
  getChallengeForScenario,
  runDesignChallenge,
} from '../../simulations/domain/challenges';
import { scenarioBySlug } from '../../simulations/domain/scenarios';
import type { ScenarioAuthoringProvider } from '../ports/scenarioAuthoringProvider';

function slugFor(objective: string) {
  const normalized = objective.toLowerCase();
  if (normalized.includes('database') || normalized.includes('replication'))
    return 'online-database-migration';
  if (normalized.includes('migration') || normalized.includes('monolith'))
    return 'monolith-strangler-migration';
  if (normalized.includes('url') || normalized.includes('redirect'))
    return 'url-shortener';
  return 'overload-protection';
}

function bubbleValues(difficulty: ScenarioDraftDifficulty) {
  if (difficulty === 'foundation') return [4, 1, 3, 2];
  if (difficulty === 'advanced') return [8, 3, 7, 2, 6, 1, 5, 4];
  return [6, 2, 5, 1, 4, 3];
}

export const mockScenarioAuthoringProvider: ScenarioAuthoringProvider = {
  provider: 'mock',
  async generate(request) {
    if (request.kind === 'bubble-sort') {
      const values = bubbleValues(request.difficulty);
      return {
        id: `bubble-sort-${request.difficulty}-draft`,
        version: 1,
        kind: 'bubble-sort',
        title: `Bubble Sort · ${request.difficulty}`,
        objective: request.objective,
        difficulty: request.difficulty,
        values,
        expectedFinal: [...values].sort((left, right) => left - right),
      };
    }
    const scenarioSlug = slugFor(request.objective);
    const scenario = scenarioBySlug.get(scenarioSlug)!;
    const definition = getChallengeForScenario(scenarioSlug)!;
    const loadProfile = definition.loadProfiles[0];
    const failure = definition.failures[0];
    const run = runDesignChallenge({
      scenarioSlug,
      challengeId: definition.id,
      graph: scenario.initialGraph,
      phaseId: definition.phaseId,
      prediction: definition.predictionOptions[0],
      loadProfile,
      failure,
    });
    const draft: DesignLabScenarioDraft = {
      id: `${definition.id}-draft`,
      version: 1,
      kind: 'design-lab',
      title: definition.title,
      objective: request.objective,
      difficulty: request.difficulty,
      scenarioSlug,
      challengeId: definition.id,
      loadProfile,
      failure,
      predictionOptions: [...definition.predictionOptions],
      expectedPrimaryEffect: run.value!.primaryEffect,
    };
    return draft;
  },
};
