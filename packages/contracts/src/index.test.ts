import { describe, expect, it } from 'vitest';
import { isApiErrorPayload } from './index';

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
