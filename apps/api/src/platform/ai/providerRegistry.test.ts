import { describe, expect, it, vi } from 'vitest';
import {
  AIProviderSelectionError,
  createAIProviderRegistry,
  resolveAIProvider,
} from './providerRegistry';

const localEnvironment = {
  NODE_ENV: 'development',
  ENABLE_LOCAL_AI_CLI: '1',
  MOCK_AI: '1',
  PATH: '/tools',
  CODEX_CLI_MODELS: 'gpt-5.5,gpt-5.4',
  CODEX_CLI_EFFORTS: 'low,medium,high,xhigh',
  CODEX_CLI_DEFAULT_MODEL: 'gpt-5.4',
  CLAUDE_CLI_MODELS: 'sonnet,opus',
  CLAUDE_CLI_EFFORTS: 'medium,high,max',
} as NodeJS.ProcessEnv;

describe('AI provider registry', () => {
  it('advertises fixed local executables and allowlisted configurations', async () => {
    const resolve = vi.fn(async (name: 'codex' | 'claude') => `/tools/${name}`);
    const registry = await createAIProviderRegistry(localEnvironment, resolve);

    expect(resolve).toHaveBeenCalledTimes(2);
    expect(registry.catalog.defaultSelection.provider).toBe('mock');
    expect(registry.providers.get('codex-cli')).toMatchObject({
      executable: '/tools/codex',
      capability: {
        available: true,
        models: ['gpt-5.5', 'gpt-5.4'],
        defaultModel: 'gpt-5.4',
      },
    });
    expect(
      resolveAIProvider(registry, {
        provider: 'claude-cli',
        model: 'opus',
        effort: 'max',
      }),
    ).toEqual({
      provider: 'claude-cli',
      model: 'opus',
      effort: 'max',
      executable: '/tools/claude',
    });
  });

  it('fails closed in production and never probes an executable', async () => {
    const resolve = vi.fn(async () => '/tools/codex');
    const registry = await createAIProviderRegistry(
      { ...localEnvironment, NODE_ENV: 'production' } as NodeJS.ProcessEnv,
      resolve,
    );

    expect(resolve).not.toHaveBeenCalled();
    expect(registry.providers.get('codex-cli')?.capability.available).toBe(
      false,
    );
    expect(() =>
      resolveAIProvider(registry, { provider: 'codex-cli' }),
    ).toThrow(AIProviderSelectionError);
  });

  it('rejects forged models and unsupported effort without falling back', async () => {
    const registry = await createAIProviderRegistry(
      localEnvironment,
      async (name) => `/tools/${name}`,
    );

    expect(() =>
      resolveAIProvider(registry, {
        provider: 'codex-cli',
        model: '--dangerous-flag',
        effort: 'high',
      }),
    ).toThrow('model is not allowed');
    expect(() =>
      resolveAIProvider(registry, {
        provider: 'mock',
        effort: 'high',
      }),
    ).toThrow('effort is not allowed');
  });
});
