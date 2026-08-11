import Link from 'next/link';
import AppShell from '../components/layout/AppShell';

export default function NotFound() {
  return (
    <AppShell>
      <section className="mx-auto max-w-2xl py-24 text-center">
        <p className="font-mono text-xs uppercase tracking-[0.24em] text-ink">
          404 / Not found
        </p>
        <h1 className="mt-5 text-4xl font-semibold tracking-tight">
          That learning node does not exist.
        </h1>
        <p className="mt-4 text-muted">
          Return to your dashboard and continue from the next recommended
          lesson.
        </p>
        <Link
          href="/dashboard"
          className="mt-8 inline-flex rounded-full bg-action px-5 py-3 text-sm font-semibold text-canvas transition hover:bg-action-hover"
        >
          Back to dashboard
        </Link>
      </section>
    </AppShell>
  );
}
