import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx,mdx}', './components/**/*.{ts,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        canvas: 'rgb(var(--color-canvas) / <alpha-value>)',
        surface: 'rgb(var(--color-surface) / <alpha-value>)',
        'surface-raised': 'rgb(var(--color-surface-raised) / <alpha-value>)',
        ink: 'rgb(var(--color-ink) / <alpha-value>)',
        'ink-soft': 'rgb(var(--color-ink-soft) / <alpha-value>)',
        muted: 'rgb(var(--color-muted) / <alpha-value>)',
        subtle: 'rgb(var(--color-subtle) / <alpha-value>)',
        faint: 'rgb(var(--color-faint) / <alpha-value>)',
        line: 'rgb(var(--color-line) / <alpha-value>)',
        'line-strong': 'rgb(var(--color-line-strong) / <alpha-value>)',
        action: 'rgb(var(--color-action) / <alpha-value>)',
        'action-hover': 'rgb(var(--color-action-hover) / <alpha-value>)',
        focus: 'rgb(var(--color-focus) / <alpha-value>)',
        success: 'rgb(var(--color-success) / <alpha-value>)',
        warning: 'rgb(var(--color-warning) / <alpha-value>)',
        danger: 'rgb(var(--color-danger) / <alpha-value>)',
        'success-muted': 'rgb(var(--color-success-muted) / <alpha-value>)',
        'warning-muted': 'rgb(var(--color-warning-muted) / <alpha-value>)',
        'danger-muted': 'rgb(var(--color-danger-muted) / <alpha-value>)',
      },
      boxShadow: {
        elevated: 'var(--shadow-elevated)',
        panel: 'var(--shadow-panel)',
      },
    },
  },
  plugins: [],
};

export default config;
