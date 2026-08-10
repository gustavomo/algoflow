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
    <main className="min-h-screen bg-[#061015] px-6 py-16 text-slate-100">
      <div className="mx-auto max-w-md rounded-3xl border border-white/10 bg-white/[0.04] p-8 shadow-2xl shadow-cyan-950/40">
        <p className="font-mono text-xs uppercase tracking-[0.28em] text-cyan-300">
          Personal workspace
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">
          Enter AlgoFlow
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          This deployment has one learner and one shared access code. No account
          is required.
        </p>
        <AccessForm nextPath={next} />
      </div>
    </main>
  );
}
