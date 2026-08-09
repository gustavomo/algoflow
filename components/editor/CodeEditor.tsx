'use client';
import Editor from '@monaco-editor/react';

export default function CodeEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <Editor
      height="200px"
      defaultLanguage="typescript"
      value={value}
      onChange={(v) => onChange(v || '')}
      options={{ minimap: { enabled: false } }}
    />
  );
}
