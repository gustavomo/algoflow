import {
  SYSTEM_NODE_CONFIG_KEYS,
  type SystemDesignScenario,
} from '@algoflow/contracts';
import { databaseScenarios } from './scenarioGroups/database';
import { expandedSystemDesignScenarios } from './scenarioGroups/expandedSystemDesign';
import { migrationScenarios } from './scenarioGroups/migrations';
import { reliabilityScenarios } from './scenarioGroups/reliability';
import { systemDesignScenarios as originalSystemDesignScenarios } from './scenarioGroups/systemDesign';
import { validateSystemGraph } from './systemDesign';

export const scenarioGroups = {
  'system-design': [
    ...originalSystemDesignScenarios,
    ...expandedSystemDesignScenarios,
  ],
  migration: migrationScenarios,
  database: databaseScenarios,
  reliability: reliabilityScenarios,
} satisfies Record<SystemDesignScenario['category'], SystemDesignScenario[]>;

export const systemDesignScenarios: SystemDesignScenario[] =
  Object.values(scenarioGroups).flat();

export const scenarioBySlug = new Map(
  systemDesignScenarios.map((scenario) => [scenario.slug, scenario]),
);

function duplicates(values: string[]) {
  const seen = new Set<string>();
  return values.filter((value) =>
    seen.has(value) ? true : (seen.add(value), false),
  );
}

export function validateScenarioCatalog(
  scenarios: SystemDesignScenario[] = systemDesignScenarios,
) {
  const errors: string[] = [];
  for (const duplicate of duplicates(scenarios.map(({ slug }) => slug)))
    errors.push(`duplicate scenario ${duplicate}`);

  for (const scenario of scenarios) {
    const prefix = scenario.slug;
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(scenario.slug))
      errors.push(`${prefix}: invalid slug`);
    if (!Number.isInteger(scenario.version) || scenario.version < 1)
      errors.push(`${prefix}: invalid version`);
    if (scenario.topics.length === 0 || scenario.topics.some((topic) => !topic))
      errors.push(`${prefix}: topics are required`);
    if (
      !Number.isInteger(scenario.estimatedMinutes) ||
      scenario.estimatedMinutes < 10 ||
      scenario.estimatedMinutes > 180
    )
      errors.push(`${prefix}: invalid estimated effort`);

    for (const graphError of validateSystemGraph(scenario.initialGraph))
      errors.push(`${prefix}: ${graphError}`);

    for (const duplicate of duplicates(scenario.flows.map(({ id }) => id)))
      errors.push(`${prefix}: duplicate flow ${duplicate}`);
    for (const scenarioFlow of scenario.flows) {
      if (scenarioFlow.nodeTypes.length < 2)
        errors.push(`${prefix}: flow ${scenarioFlow.id} is too short`);
      if (scenarioFlow.nodeTypes.length !== scenarioFlow.narration.length)
        errors.push(`${prefix}: flow ${scenarioFlow.id} narration mismatch`);
    }

    if (scenario.category === 'migration' && !scenario.phases?.length)
      errors.push(`${prefix}: migration phases are required`);
    const flowIds = new Set(scenario.flows.map(({ id }) => id));
    if (scenario.phases) {
      for (const duplicate of duplicates(scenario.phases.map(({ id }) => id)))
        errors.push(`${prefix}: duplicate phase ${duplicate}`);
      for (const phase of scenario.phases) {
        if (!phase.goal.trim() || !phase.gate.trim())
          errors.push(`${prefix}: phase ${phase.id} needs goal and gate`);
        for (const flowId of phase.flowIds)
          if (!flowIds.has(flowId))
            errors.push(`${prefix}: phase ${phase.id} references ${flowId}`);
      }
    }

    for (const duplicate of duplicates(scenario.rubric.map(({ id }) => id)))
      errors.push(`${prefix}: duplicate rubric ${duplicate}`);
    if (scenario.rubric.reduce((sum, rule) => sum + rule.weight, 0) !== 100)
      errors.push(`${prefix}: rubric weights must total 100`);
    for (const rubricRule of scenario.rubric) {
      const check = rubricRule.check;
      if (
        (check.kind === 'config-truthy' || check.kind === 'config-equals') &&
        !SYSTEM_NODE_CONFIG_KEYS.includes(check.key as never)
      )
        errors.push(`${prefix}: unsupported rubric config ${check.key}`);
      if (
        check.kind === 'node-count' &&
        (check.minCount < 0 ||
          (check.maxCount != null && check.maxCount < check.minCount))
      )
        errors.push(`${prefix}: invalid node count rubric ${rubricRule.id}`);
    }
  }

  return Array.from(new Set(errors));
}
