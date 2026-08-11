import { describe, expect, it } from 'vitest';
import { LocalAIProviderError } from '../../ai/localCli';
import { AIProviderSelectionError } from '../../ai/providerRegistry';
import { aiProviderApiError } from '../aiProviderErrors';

describe('AI provider API errors', () => {
  it('maps selection errors to non-retryable validation responses', () => {
    expect(
      aiProviderApiError(new AIProviderSelectionError('Not allowed.')),
    ).toMatchObject({ status: 400, code: 'invalid_ai_provider' });
  });

  it.each([
    ['timeout', 504, 'ai_provider_timeout'],
    ['overflow', 502, 'ai_provider_output_too_large'],
    ['failed', 502, 'local_ai_provider_unavailable'],
  ] as const)('maps %s failures safely', (kind, status, code) => {
    expect(aiProviderApiError(new LocalAIProviderError(kind))).toMatchObject({
      status,
      code,
      retryable: true,
    });
  });
});
