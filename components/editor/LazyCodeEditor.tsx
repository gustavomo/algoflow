'use client';

import dynamic from 'next/dynamic';

const CodeEditor = dynamic(() => import('./CodeEditor'), {
  ssr: false,
  loading: () => (
    <div className="grid h-72 place-items-center rounded-2xl border border-white/10 bg-black/20 text-sm text-slate-500">
      Loading editor worker…
    </div>
  ),
});

export default function LazyCodeEditor({ language }: { language: string }) {
  return <CodeEditor language={language} />;
}
