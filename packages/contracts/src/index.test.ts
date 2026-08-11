import { describe, expect, it } from 'vitest';
import { isApiErrorPayload, isLearningResource } from './index';

describe('transport contracts', () => {
  it('recognizes only stable API error envelopes', () => {
    expect(
      isApiErrorPayload({
        error: { code: 'invalid', message: 'Invalid.', retryable: false },
      }),
    ).toBe(true);
    expect(isApiErrorPayload({ error: { message: 'Invalid.' } })).toBe(false);
    expect(isApiErrorPayload(null)).toBe(false);
  });
});

describe('learning resource contracts', () => {
  const resource = {
    id: 'primary-reference',
    title: 'Primary reference',
    provider: 'Example University',
    url: 'https://example.edu/reference',
    kind: 'course',
    access: 'free',
    language: 'en',
  };

  it('accepts complete resource metadata', () => {
    expect(isLearningResource(resource)).toBe(true);
  });

  it('rejects empty and unsupported metadata', () => {
    expect(isLearningResource({ ...resource, title: '' })).toBe(false);
    expect(isLearningResource({ ...resource, kind: 'social-post' })).toBe(
      false,
    );
    expect(isLearningResource({ ...resource, language: 'fr' })).toBe(false);
  });
});
