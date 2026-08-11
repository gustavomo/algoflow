'use client';

import { FormEvent, useState } from 'react';

export default function AccessForm({ nextPath }: { nextPath: string }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!code.trim()) {
      setError('Enter the access code.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const body = await response.json();
      if (!response.ok)
        throw new Error(body.error?.message || 'Access failed.');
      window.location.assign(nextPath);
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : 'Access failed.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-8 space-y-4">
      <label
        className="block text-sm font-medium text-ink-soft"
        htmlFor="access-code"
      >
        Access code
      </label>
      <input
        id="access-code"
        type="password"
        value={code}
        onChange={(event) => setCode(event.target.value)}
        autoComplete="current-password"
        className="w-full rounded-xl border border-line bg-canvas/60 px-4 py-3 outline-none ring-focus transition focus:ring-2"
      />
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      <button
        disabled={loading}
        className="w-full rounded-xl bg-action px-4 py-3 font-semibold text-canvas transition hover:bg-action-hover disabled:opacity-60"
      >
        {loading ? 'Checking…' : 'Continue'}
      </button>
    </form>
  );
}
