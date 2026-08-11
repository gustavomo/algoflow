'use client';

import AppShell from '../components/layout/AppShell';

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <AppShell>
      <section className="mx-auto max-w-2xl py-24 text-center">
        <p className="font-mono text-xs uppercase tracking-[0.24em] text-danger">
          Runtime interruption
        </p>
        <h1 className="mt-5 text-4xl font-semibold tracking-tight">
          This view could not be loaded.
        </h1>
        <p className="mt-4 text-muted">
          Your saved learning state is still on the server. Retry this view when
          you are ready.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-8 rounded-full bg-action px-5 py-3 text-sm font-semibold text-canvas transition hover:bg-action-hover"
        >
          Try again
        </button>
      </section>
    </AppShell>
  );
}
