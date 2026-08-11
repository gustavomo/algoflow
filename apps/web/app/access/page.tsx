import AccessForm from '../../components/access/AccessForm';
import { safeRedirectPath } from '../../lib/access/redirect';

export const metadata = { title: 'Access · AlgoFlow' };

export default async function AccessPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next: requestedPath } = await searchParams;
  const next = safeRedirectPath(requestedPath);
  return (
    <main className="min-h-screen bg-canvas px-6 py-16 text-ink">
      <div className="mx-auto max-w-md rounded-3xl border border-line bg-surface p-8 shadow-2xl shadow-black/40">
        <p className="font-mono text-xs uppercase tracking-[0.28em] text-ink">
          Personal workspace
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">
          Enter AlgoFlow
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          This deployment has one learner and one shared access code. No account
          is required.
        </p>
        <AccessForm nextPath={next} />
      </div>
    </main>
  );
}
