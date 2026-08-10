import { afterEach, describe, expect, it } from 'vitest';
import { safeRedirectPath } from '../redirect';
import { createAccessToken, isAccessBypassed } from '../token';

const originalMockAccess = process.env.MOCK_ACCESS;
const originalAccessCode = process.env.APP_ACCESS_CODE;

afterEach(() => {
  process.env.MOCK_ACCESS = originalMockAccess;
  process.env.APP_ACCESS_CODE = originalAccessCode;
});

describe('access tokens', () => {
  it('creates a deterministic opaque signature tied to the secret', async () => {
    const first = await createAccessToken('one secret');
    const repeated = await createAccessToken('one secret');
    const different = await createAccessToken('another secret');

    expect(first).toBe(repeated);
    expect(first).not.toBe(different);
    expect(first).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it('supports an explicit local access bypass', () => {
    process.env.MOCK_ACCESS = '1';
    process.env.APP_ACCESS_CODE = 'configured';
    expect(isAccessBypassed()).toBe(true);
  });

  it('never bypasses access in production', () => {
    expect(
      isAccessBypassed({
        NODE_ENV: 'production',
        MOCK_ACCESS: '1',
        APP_ACCESS_CODE: '',
      }),
    ).toBe(false);
  });

  it('keeps post-login redirects inside the application', () => {
    expect(safeRedirectPath('/lessons/bubble-sort-js?step=2')).toBe(
      '/lessons/bubble-sort-js?step=2',
    );
    expect(safeRedirectPath('//evil.example/steal')).toBe('/dashboard');
    expect(safeRedirectPath('https://evil.example/steal')).toBe('/dashboard');
  });
});
