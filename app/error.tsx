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
        <p className="font-mono text-xs uppercase tracking-[0.24em] text-rose-300">
          Runtime interruption
        </p>
        <h1 className="mt-5 text-4xl font-semibold tracking-tight">
          This view could not be loaded.
        </h1>
        <p className="mt-4 text-slate-400">
          Your saved learning state is still on the server. Retry this view when
          you are ready.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-8 rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
        >
          Try again
        </button>
      </section>
    </AppShell>
  );
}
