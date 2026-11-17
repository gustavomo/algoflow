import { describe, expect, it } from 'vitest';
import {
  THEME_INIT_SCRIPT,
  THEME_STORAGE_KEY,
  isThemePreference,
  nextThemePreference,
  resolveTheme,
} from '../theme';

function runInitScript(stored: string | null | Error, prefersLight: boolean) {
  const root = {
    dataset: {} as Record<string, string>,
    style: {} as Record<string, string>,
  };
  const localStorage = {
    getItem(key: string) {
      if (stored instanceof Error) throw stored;
      return key === THEME_STORAGE_KEY ? stored : null;
    },
  };
  new Function('localStorage', 'matchMedia', 'document', THEME_INIT_SCRIPT)(
    localStorage,
    () => ({ matches: prefersLight }),
    { documentElement: root },
  );
  return root;
}

describe('theme preference', () => {
  it('cycles system, light, dark and back', () => {
    expect(nextThemePreference('system')).toBe('light');
    expect(nextThemePreference('light')).toBe('dark');
    expect(nextThemePreference('dark')).toBe('system');
  });

  it('resolves system from the OS and keeps explicit choices', () => {
    expect(resolveTheme('system', true)).toBe('light');
    expect(resolveTheme('system', false)).toBe('dark');
    expect(resolveTheme('light', false)).toBe('light');
    expect(resolveTheme('dark', true)).toBe('dark');
  });

  it('accepts only known preferences', () => {
    expect(isThemePreference('light')).toBe(true);
    expect(isThemePreference('sepia')).toBe(false);
    expect(isThemePreference(null)).toBe(false);
  });
});

describe('theme init script', () => {
  it('applies a stored choice over the OS preference', () => {
    const root = runInitScript('light', false);
    expect(root.dataset.theme).toBe('light');
    expect(root.style.colorScheme).toBe('light');
    expect(runInitScript('dark', true).dataset.theme).toBe('dark');
  });

  it('follows the OS when nothing valid is stored', () => {
    expect(runInitScript(null, true).dataset.theme).toBe('light');
    expect(runInitScript(null, false).dataset.theme).toBe('dark');
    expect(runInitScript('sepia', true).dataset.theme).toBe('light');
  });

  it('survives blocked storage', () => {
    const root = runInitScript(new Error('denied'), false);
    expect(root.dataset.theme).toBe('dark');
  });
});
