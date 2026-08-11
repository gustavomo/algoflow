'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function FocusPathButton({
  pathSlug,
  focused,
}: {
  pathSlug: string;
  focused: boolean;
}) {
  const router = useRouter();
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  async function updateFocus() {
    setLoading(true);
    setStatus('');
    try {
      const response = await fetch('/api/focus', {
        method: focused ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: focused ? undefined : JSON.stringify({ pathSlug }),
      });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.error?.message || 'Could not update your focus.');
      }
      setStatus(
        focused ? 'Focus cleared.' : 'Focused path saved on the server.',
      );
      router.refresh();
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : 'Could not update your focus.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={updateFocus}
        disabled={loading}
        className={
          focused
            ? 'button-secondary px-4 py-2 text-sm'
            : 'button-primary px-4 py-2 text-sm'
        }
      >
        {loading ? 'Saving…' : focused ? 'Clear focus' : 'Focus this path'}
      </button>
      {status && (
        <p className="mt-2 text-xs text-subtle" role="status">
          {status}
        </p>
      )}
    </div>
  );
}
