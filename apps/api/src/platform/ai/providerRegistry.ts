import { constants } from 'node:fs';
import { access } from 'node:fs/promises';
import path from 'node:path';
import {
  AI_EFFORTS,
  type AIEffort,
  type AIProviderCapability,
  type AIProviderCatalog,
  type AIProviderConfiguration,
  type AIProviderId,
  type AIProviderSelection,
} from '@algoflow/contracts';

type Environment = NodeJS.ProcessEnv;
export type ExecutableResolver = (
  executable: 'codex' | 'claude',
  environment: Environment,
) => Promise<string | undefined>;

export interface RegisteredAIProvider {
  capability: AIProviderCapability;
  executable?: string;
}

export interface AIProviderRegistry {
  catalog: AIProviderCatalog;
  providers: Map<AIProviderId, RegisteredAIProvider>;
}

export interface ResolvedAIProvider extends AIProviderConfiguration {
  executable?: string;
}

export class AIProviderSelectionError extends Error {
  readonly code = 'invalid_ai_provider';
}

const MODEL_NAME = /^[a-zA-Z0-9][a-zA-Z0-9._:/-]{0,79}$/;

function list(value: string | undefined, fallback: string[]) {
  const parsed = (value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter((item) => MODEL_NAME.test(item));
  return [...new Set(parsed.length ? parsed : fallback)];
}

function efforts(value: string | undefined, fallback: AIEffort[]) {
  const parsed = list(value, fallback).filter((item): item is AIEffort =>
    AI_EFFORTS.includes(item as AIEffort),
  );
  return parsed.length ? parsed : fallback;
}

function preferred<T extends string>(
  value: string | undefined,
  allowed: T[],
): T {
  return allowed.includes(value as T) ? (value as T) : allowed[0];
}

function localCliUnavailableReason(environment: Environment) {
  if (environment.ENABLE_LOCAL_AI_CLI !== '1')
    return 'Local CLI providers are disabled.';
  if (environment.NODE_ENV === 'production' || environment.VERCEL)
    return 'Local CLI providers are unavailable in deployed environments.';
  return undefined;
}

export async function findExecutable(
  executable: 'codex' | 'claude',
  environment: Environment,
) {
  const directories = (environment.PATH ?? '').split(path.delimiter);
  const extensions =
    process.platform === 'win32'
      ? (environment.PATHEXT ?? '.EXE;.CMD;.BAT').split(';')
      : [''];
  for (const directory of directories) {
    if (!directory) continue;
    for (const extension of extensions) {
      const candidate = path.join(directory, `${executable}${extension}`);
      try {
        await access(candidate, constants.X_OK);
        return candidate;
      } catch {
        // Continue through the fixed PATH candidates.
      }
    }
  }
  return undefined;
}

function cliCapability(
  id: 'codex-cli' | 'claude-cli',
  label: string,
  models: string[],
  allowedEfforts: AIEffort[],
  defaultModel: string,
  defaultEffort: AIEffort,
  executable: string | undefined,
  policyReason: string | undefined,
): RegisteredAIProvider {
  const unavailableReason =
    policyReason ??
    (!executable
      ? `${label} is not installed on the API server PATH.`
      : undefined);
  return {
    capability: {
      id,
      label,
      available: !unavailableReason,
      models,
      efforts: allowedEfforts,
      defaultModel,
      defaultEffort,
      unavailableReason,
    },
    executable,
  };
}

export async function createAIProviderRegistry(
  environment: Environment = process.env,
  resolveExecutable: ExecutableResolver = findExecutable,
): Promise<AIProviderRegistry> {
  const policyReason = localCliUnavailableReason(environment);
  const [codexExecutable, claudeExecutable] = policyReason
    ? [undefined, undefined]
    : await Promise.all([
        resolveExecutable('codex', environment),
        resolveExecutable('claude', environment),
      ]);

  const codexModels = list(environment.CODEX_CLI_MODELS, ['gpt-5.5']);
  const codexEfforts = efforts(environment.CODEX_CLI_EFFORTS, [
    'low',
    'medium',
    'high',
    'xhigh',
  ]);
  const claudeModels = list(environment.CLAUDE_CLI_MODELS, ['sonnet']);
  const claudeEfforts = efforts(environment.CLAUDE_CLI_EFFORTS, [
    'low',
    'medium',
    'high',
    'xhigh',
    'max',
  ]);
  const openAIAvailable = Boolean(environment.OPENAI_API_KEY);

  const registrations: RegisteredAIProvider[] = [
    {
      capability: {
        id: 'mock',
        label: 'Offline mock',
        available: true,
        models: ['deterministic-v1'],
        efforts: [],
        defaultModel: 'deterministic-v1',
      },
    },
    {
      capability: {
        id: 'openai',
        label: 'OpenAI API',
        available: openAIAvailable,
        models: ['gpt-4o-mini'],
        efforts: [],
        defaultModel: 'gpt-4o-mini',
        unavailableReason: openAIAvailable
          ? undefined
          : 'OpenAI API is not configured.',
      },
    },
    cliCapability(
      'codex-cli',
      'Codex CLI',
      codexModels,
      codexEfforts,
      preferred(environment.CODEX_CLI_DEFAULT_MODEL, codexModels),
      preferred(environment.CODEX_CLI_DEFAULT_EFFORT, codexEfforts),
      codexExecutable,
      policyReason,
    ),
    cliCapability(
      'claude-cli',
      'Claude CLI',
      claudeModels,
      claudeEfforts,
      preferred(environment.CLAUDE_CLI_DEFAULT_MODEL, claudeModels),
      preferred(environment.CLAUDE_CLI_DEFAULT_EFFORT, claudeEfforts),
      claudeExecutable,
      policyReason,
    ),
  ];
  const defaultProvider =
    environment.MOCK_AI === '1' || !openAIAvailable ? 'mock' : 'openai';
  const defaultRegistration = registrations.find(
    ({ capability }) => capability.id === defaultProvider,
  )!;
  const catalog: AIProviderCatalog = {
    providers: registrations.map(({ capability }) => capability),
    defaultSelection: {
      provider: defaultRegistration.capability.id,
      model: defaultRegistration.capability.defaultModel,
      effort: defaultRegistration.capability.defaultEffort,
    },
  };
  return {
    catalog,
    providers: new Map(
      registrations.map((registration) => [
        registration.capability.id,
        registration,
      ]),
    ),
  };
}

export function resolveAIProvider(
  registry: AIProviderRegistry,
  selection?: AIProviderSelection,
): ResolvedAIProvider {
  const requested =
    selection?.provider ?? registry.catalog.defaultSelection.provider;
  const registration = registry.providers.get(requested);
  if (!registration?.capability.available) {
    throw new AIProviderSelectionError(
      registration?.capability.unavailableReason ??
        'The selected AI provider is unavailable.',
    );
  }
  const model = selection?.model ?? registration.capability.defaultModel;
  if (!registration.capability.models.includes(model)) {
    throw new AIProviderSelectionError(
      'The selected model is not allowed for this provider.',
    );
  }
  if (
    selection?.effort &&
    !registration.capability.efforts.includes(selection.effort)
  ) {
    throw new AIProviderSelectionError(
      'The selected effort is not allowed for this provider.',
    );
  }
  const effort = registration.capability.efforts.length
    ? selection?.effort ?? registration.capability.defaultEffort
    : undefined;
  return {
    provider: registration.capability.id,
    model,
    effort,
    executable: registration.executable,
  };
}

export function assertLocalCliInvocationAllowed(
  environment: Environment = process.env,
) {
  const reason = localCliUnavailableReason(environment);
  if (reason) throw new AIProviderSelectionError(reason);
}
