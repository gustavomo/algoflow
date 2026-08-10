import Link from 'next/link';
import AppShell from '../components/layout/AppShell';

export default function NotFound() {
  return (
    <AppShell>
      <section className="mx-auto max-w-2xl py-24 text-center">
        <p className="font-mono text-xs uppercase tracking-[0.24em] text-cyan-300">
          404 / Not found
        </p>
        <h1 className="mt-5 text-4xl font-semibold tracking-tight">
          That learning node does not exist.
        </h1>
        <p className="mt-4 text-slate-400">
          Return to your dashboard and continue from the next recommended
          lesson.
        </p>
        <Link
          href="/dashboard"
          className="mt-8 inline-flex rounded-full bg-cyan-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200"
        >
          Back to dashboard
        </Link>
      </section>
    </AppShell>
  );
}
