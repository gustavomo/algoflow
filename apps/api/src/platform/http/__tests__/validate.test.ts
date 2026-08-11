import { describe, expect, it } from 'vitest';
import { ApiError } from '../errors';
import { optionalAIProviderSelection } from '../validate';

describe('AI provider request validation', () => {
  it('keeps omitted provider settings backward compatible', () => {
    expect(optionalAIProviderSelection({ question: 'Why?' })).toBeUndefined();
  });

  it('accepts a coherent provider selection', () => {
    expect(
      optionalAIProviderSelection({
        provider: 'codex-cli',
        model: 'gpt-5.5',
        effort: 'xhigh',
      }),
    ).toEqual({
      provider: 'codex-cli',
      model: 'gpt-5.5',
      effort: 'xhigh',
    });
  });

  it.each([
    { model: 'gpt-5.5' },
    { provider: 'shell' },
    { provider: 'claude-cli', effort: 'infinite' },
    { provider: 'codex-cli', model: '' },
  ])('rejects an incoherent selection %#', (body) => {
    expect(() => optionalAIProviderSelection(body)).toThrow(ApiError);
  });
});
