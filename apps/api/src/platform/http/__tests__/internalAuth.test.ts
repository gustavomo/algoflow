import type { NextApiRequest } from 'next';
import { afterEach, describe, expect, it } from 'vitest';
import { ApiError } from '../errors';
import { requireInternalAuth } from '../internalAuth';

const originalSecret = process.env.BACKEND_SHARED_SECRET;

afterEach(() => {
  process.env.BACKEND_SHARED_SECRET = originalSecret;
});

function request(token?: string) {
  return {
    headers: token ? { authorization: `Bearer ${token}` } : {},
  } as NextApiRequest;
}

describe('internal backend authentication', () => {
  it('accepts only the configured server token', () => {
    process.env.BACKEND_SHARED_SECRET = 'expected-secret';
    expect(() => requireInternalAuth(request('expected-secret'))).not.toThrow();
    expect(() => requireInternalAuth(request('wrong-secret'))).toThrow(
      ApiError,
    );
  });

  it('fails closed when the secret is missing', () => {
    delete process.env.BACKEND_SHARED_SECRET;
    expect(() => requireInternalAuth(request('anything'))).toThrow(ApiError);
  });
});
