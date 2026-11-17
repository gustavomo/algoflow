/**
 * Theme preference and the resolved theme behind `data-theme` on <html>.
 * The preference is `system | light | dark`; `system` follows the OS and keeps
 * following it while it is selected.
 */
export type ThemePreference = 'system' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'algoflow-theme';
export const THEME_PREFERENCES: readonly ThemePreference[] = [
  'system',
  'light',
  'dark',
];

/**
 * Canvas colours as literals, for the few places that cannot read a CSS
 * variable (the browser chrome `theme-color`). Keep them in sync with
 * `--color-canvas` in `app/globals.css`.
 */
export const DARK_CANVAS_HEX = '#101216';
export const LIGHT_CANVAS_HEX = '#f6f7f9';

const CANVAS_HEX: Record<ResolvedTheme, string> = {
  light: LIGHT_CANVAS_HEX,
  dark: DARK_CANVAS_HEX,
};

const LIGHT_QUERY = '(prefers-color-scheme: light)';

/**
 * Runs in <head> before first paint so the page never flashes the wrong theme.
 * It only touches attributes of <html>, which is rendered with
 * `suppressHydrationWarning`, so the server markup stays deterministic.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var p=null;try{p=localStorage.getItem('${THEME_STORAGE_KEY}')}catch(e){}var t=p==='light'||p==='dark'?p:matchMedia('${LIGHT_QUERY}').matches?'light':'dark';var d=document.documentElement;d.dataset.theme=t;d.style.colorScheme=t}catch(e){}})();`;

export function isThemePreference(value: unknown): value is ThemePreference {
  return value === 'system' || value === 'light' || value === 'dark';
}

export function nextThemePreference(current: ThemePreference): ThemePreference {
  const index = THEME_PREFERENCES.indexOf(current);
  return THEME_PREFERENCES[(index + 1) % THEME_PREFERENCES.length];
}

export function resolveTheme(
  preference: ThemePreference,
  systemPrefersLight: boolean,
): ResolvedTheme {
  if (preference === 'system') return systemPrefersLight ? 'light' : 'dark';
  return preference;
}

const listeners = new Set<() => void>();
let wired = false;
/** The last choice made on this page, used when storage is unavailable. */
let unsavedPreference: ThemePreference = 'system';

function readPreference(): ThemePreference {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isThemePreference(stored) ? stored : 'system';
  } catch {
    return unsavedPreference;
  }
}

function applyTheme() {
  const resolved = resolveTheme(
    readPreference(),
    window.matchMedia(LIGHT_QUERY).matches,
  );
  const root = document.documentElement;
  root.dataset.theme = resolved;
  root.style.colorScheme = resolved;
  document
    .querySelectorAll('meta[name="theme-color"]')
    .forEach((meta) => meta.setAttribute('content', CANVAS_HEX[resolved]));
  listeners.forEach((listener) => listener());
}

/** Follows OS changes and changes made in other tabs. */
function wire() {
  if (wired) return;
  wired = true;
  window.matchMedia(LIGHT_QUERY).addEventListener('change', applyTheme);
  window.addEventListener('storage', (event) => {
    if (event.key === null || event.key === THEME_STORAGE_KEY) applyTheme();
  });
  applyTheme();
}

export function subscribeTheme(listener: () => void) {
  listeners.add(listener);
  wire();
  return () => {
    listeners.delete(listener);
  };
}

export const getThemePreference = (): ThemePreference => readPreference();
export const getServerThemePreference = (): ThemePreference => 'system';

export const getResolvedTheme = (): ResolvedTheme =>
  document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
export const getServerResolvedTheme = (): ResolvedTheme => 'dark';

export function setThemePreference(preference: ThemePreference) {
  unsavedPreference = preference;
  try {
    if (preference === 'system') {
      window.localStorage.removeItem(THEME_STORAGE_KEY);
    } else {
      window.localStorage.setItem(THEME_STORAGE_KEY, preference);
    }
  } catch {
    // Storage can be blocked; the choice then lasts for this page only.
  }
  applyTheme();
}
