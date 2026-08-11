'use client';

import dynamic from 'next/dynamic';

const CodeEditor = dynamic(() => import('./CodeEditor'), {
  ssr: false,
  loading: () => (
    <div className="grid h-72 place-items-center rounded-2xl border border-line bg-canvas/60 text-sm text-subtle">
      Loading editor worker…
    </div>
  ),
});

export default function LazyCodeEditor({ language }: { language: string }) {
  return <CodeEditor language={language} />;
}
