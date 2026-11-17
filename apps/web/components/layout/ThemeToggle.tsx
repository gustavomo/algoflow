'use client';

import { useSyncExternalStore } from 'react';
import {
  getServerThemePreference,
  getThemePreference,
  nextThemePreference,
  setThemePreference,
  subscribeTheme,
  type ThemePreference,
} from '../../lib/theme';

const LABEL: Record<ThemePreference, string> = {
  system: 'System',
  light: 'Light',
  dark: 'Dark',
};

function ThemeIcon({ preference }: { preference: ThemePreference }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {preference === 'system' && (
        <>
          <rect x="3" y="4" width="18" height="12" rx="2" />
          <path d="M8 20h8M12 16v4" />
        </>
      )}
      {preference === 'light' && (
        <>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </>
      )}
      {preference === 'dark' && (
        <path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11Z" />
      )}
    </svg>
  );
}

/** Cycles the theme preference: system, light, dark. */
export default function ThemeToggle() {
  const preference = useSyncExternalStore(
    subscribeTheme,
    getThemePreference,
    getServerThemePreference,
  );
  const next = nextThemePreference(preference);
  const label = `Theme: ${LABEL[preference]}. Switch to ${LABEL[next]}.`;
  return (
    <button
      type="button"
      onClick={() => setThemePreference(next)}
      aria-label={label}
      title={label}
      className="grid h-11 w-11 shrink-0 place-items-center rounded-lg text-muted transition hover:bg-surface hover:text-ink"
    >
      <ThemeIcon preference={preference} />
    </button>
  );
}
