import { notFound } from 'next/navigation';
import ScenarioAuthoringWorkbench from '../../../components/authoring/ScenarioAuthoringWorkbench';
import AppShell from '../../../components/layout/AppShell';

export const dynamic = 'force-dynamic';

export default function ScenarioAuthoringPage() {
  if (
    process.env.ENABLE_SCENARIO_AUTHORING !== '1' ||
    process.env.NODE_ENV === 'production'
  )
    notFound();
  return (
    <AppShell>
      <p className="eyebrow">Local authoring lab</p>
      <h1 className="mt-3 max-w-3xl text-4xl font-semibold">
        Generate drafts. Prove their state model. Export deliberately.
      </h1>
      <p className="mt-4 max-w-3xl text-lg leading-8 text-muted">
        This workspace is local-only and export-only. AI can propose a typed
        draft; deterministic evals decide whether it is coherent enough for
        human review.
      </p>
      <ScenarioAuthoringWorkbench />
    </AppShell>
  );
}
