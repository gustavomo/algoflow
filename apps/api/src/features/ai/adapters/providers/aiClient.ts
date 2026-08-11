import type { AIProviderSelection } from '@algoflow/contracts';
import {
  createAIProviderRegistry,
  resolveAIProvider,
  type AIProviderRegistry,
} from '../../../../platform/ai/providerRegistry';
import type { CliProcessRunner } from '../../../../platform/process/cliProcessRunner';
import type { AIClient } from '../../ports/aiClient';

export type { AIClient } from '../../ports/aiClient';

export async function getClient(
  selection?: AIProviderSelection,
  runner?: CliProcessRunner,
  providedRegistry?: AIProviderRegistry,
): Promise<AIClient> {
  const registry = providedRegistry ?? (await createAIProviderRegistry());
  const resolved = resolveAIProvider(registry, selection);
  if (resolved.provider === 'mock') {
    const { mockClient } = await import('./mockClient');
    return mockClient;
  }
  if (resolved.provider === 'openai') {
    const { openaiClient } = await import('./openaiClient');
    return openaiClient;
  }
  const { createCliClient } = await import('./cliClient');
  return createCliClient(resolved, resolved.executable!, runner);
}
