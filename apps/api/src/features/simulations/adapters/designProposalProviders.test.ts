import { describe, expect, it } from 'vitest';
import { createAIProviderRegistry } from '../../../platform/ai/providerRegistry';
import { getDesignProposalProvider } from './designProposalProviders';

async function registry() {
  return createAIProviderRegistry(
    {
      NODE_ENV: 'development',
      ENABLE_LOCAL_AI_CLI: '1',
      MOCK_AI: '1',
      PATH: '/tools',
      CODEX_CLI_MODELS: 'gpt-5.5',
      CLAUDE_CLI_MODELS: 'sonnet',
    } as NodeJS.ProcessEnv,
    async (name) => `/tools/${name}`,
  );
}

describe('design proposal provider factory', () => {
  it('uses the deterministic provider by default', async () => {
    const provider = await getDesignProposalProvider(
      undefined,
      undefined,
      await registry(),
    );
    expect(provider).toMatchObject({
      provider: 'mock',
      model: 'deterministic-v1',
    });
  });

  it('creates a configured local provider without changing the default', async () => {
    const providers = await registry();
    const provider = await getDesignProposalProvider(
      { provider: 'claude-cli', model: 'sonnet', effort: 'high' },
      undefined,
      providers,
    );
    const defaultProvider = await getDesignProposalProvider(
      undefined,
      undefined,
      providers,
    );

    expect(provider).toMatchObject({
      provider: 'claude-cli',
      model: 'sonnet',
      effort: 'high',
    });
    expect(defaultProvider.provider).toBe('mock');
  });
});
