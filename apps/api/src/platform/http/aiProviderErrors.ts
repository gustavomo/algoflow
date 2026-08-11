import { LocalAIProviderError } from '../ai/localCli';
import { AIProviderSelectionError } from '../ai/providerRegistry';
import { ApiError } from './errors';

export function aiProviderApiError(error: unknown) {
  if (error instanceof AIProviderSelectionError) {
    return new ApiError(400, error.code, error.message);
  }
  if (error instanceof LocalAIProviderError) {
    if (error.kind === 'timeout') {
      return new ApiError(
        504,
        'ai_provider_timeout',
        'The local AI provider exceeded its time limit. Try a lower effort.',
        true,
      );
    }
    if (error.kind === 'overflow') {
      return new ApiError(
        502,
        'ai_provider_output_too_large',
        'The local AI provider returned too much output.',
        true,
      );
    }
    return new ApiError(
      502,
      'local_ai_provider_unavailable',
      'The local AI provider is unavailable. Verify its terminal authentication and try again.',
      true,
    );
  }
  return undefined;
}
