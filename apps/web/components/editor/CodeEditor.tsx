'use client';

import Editor, { loader } from '@monaco-editor/react';
import { useSyncExternalStore } from 'react';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import 'monaco-editor/esm/vs/basic-languages/go/go.contribution';
import 'monaco-editor/esm/vs/basic-languages/javascript/javascript.contribution';
import 'monaco-editor/esm/vs/basic-languages/python/python.contribution';
import 'monaco-editor/esm/vs/basic-languages/sql/sql.contribution';
import 'monaco-editor/esm/vs/language/typescript/monaco.contribution';
import {
  getResolvedTheme,
  getServerResolvedTheme,
  subscribeTheme,
} from '../../lib/theme';

if (typeof window !== 'undefined') {
  self.MonacoEnvironment = {
    getWorker(_moduleId, label) {
      if (label === 'typescript' || label === 'javascript') {
        return new Worker(
          new URL(
            'monaco-editor/esm/vs/language/typescript/ts.worker.js',
            import.meta.url,
          ),
          { type: 'module' },
        );
      }
      return new Worker(
        new URL(
          'monaco-editor/esm/vs/editor/editor.worker.js',
          import.meta.url,
        ),
        { type: 'module' },
      );
    },
  };
  loader.config({ monaco });
}

export default function CodeEditor({
  language = 'javascript',
}: {
  language?: string;
}) {
  const theme = useSyncExternalStore(
    subscribeTheme,
    getResolvedTheme,
    getServerResolvedTheme,
  );
  return (
    <div className="min-w-0 max-w-full overflow-hidden rounded-2xl border border-line">
      <Editor
        height="300px"
        theme={theme === 'light' ? 'vs' : 'vs-dark'}
        defaultLanguage={language}
        defaultValue={'// Try the algorithm here\n'}
        options={{
          minimap: { enabled: false },
          fontSize: 13,
          padding: { top: 16 },
          automaticLayout: true,
        }}
      />
    </div>
  );
}
