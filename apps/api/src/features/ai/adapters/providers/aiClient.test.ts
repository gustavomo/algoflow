import { describe, expect, it } from 'vitest';
import { createAIProviderRegistry } from '../../../../platform/ai/providerRegistry';
import { getClient } from './aiClient';

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

describe('AI client factory', () => {
  it('preserves the offline default', async () => {
    const client = await getClient(undefined, undefined, await registry());
    expect(client).toMatchObject({
      provider: 'mock',
      model: 'deterministic-v1',
    });
  });

  it('creates request-scoped Codex and Claude clients', async () => {
    const providers = await registry();
    const codex = await getClient(
      { provider: 'codex-cli', model: 'gpt-5.5', effort: 'high' },
      undefined,
      providers,
    );
    const claude = await getClient(
      { provider: 'claude-cli', model: 'sonnet', effort: 'max' },
      undefined,
      providers,
    );

    expect(codex).toMatchObject({
      provider: 'codex-cli',
      model: 'gpt-5.5',
      effort: 'high',
    });
    expect(claude).toMatchObject({
      provider: 'claude-cli',
      model: 'sonnet',
      effort: 'max',
    });
  });
});
