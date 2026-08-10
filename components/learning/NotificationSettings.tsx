'use client';

import { useState } from 'react';
import type { NotificationPreferences } from '../../lib/learning/types';

function base64ToUint8Array(value: string) {
  const padding = '='.repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replaceAll('-', '+').replaceAll('_', '/');
  const raw = window.atob(base64);
  return Uint8Array.from([...raw].map((character) => character.charCodeAt(0)));
}

export default function NotificationSettings({
  initialPreferences,
}: {
  initialPreferences: NotificationPreferences;
}) {
  const [enabled, setEnabled] = useState(initialPreferences.enabled);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const supported =
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window;

  async function savePreferences(nextEnabled: boolean) {
    const response = await fetch('/api/notifications/preferences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        enabled: nextEnabled,
        timezone: initialPreferences.timezone,
      }),
    });
    if (!response.ok)
      throw new Error(
        (await response.json()).error?.message || 'Could not save preferences.',
      );
  }

  async function enable() {
    setLoading(true);
    setStatus('');
    try {
      if (!supported)
        throw new Error(
          'Background push is not supported in this browser. In-app review reminders still work.',
        );
      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!publicKey)
        throw new Error('Push is not configured on this deployment.');
      const permission = await Notification.requestPermission();
      if (permission !== 'granted')
        throw new Error('Notification permission was not granted.');
      const registration = await navigator.serviceWorker.register('/sw.js');
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: base64ToUint8Array(publicKey),
      });
      const response = await fetch('/api/notifications/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: subscription.toJSON() }),
      });
      if (!response.ok)
        throw new Error(
          (await response.json()).error?.message ||
            'Could not save the push subscription.',
        );
      await savePreferences(true);
      setEnabled(true);
      setStatus('Daily review reminders are enabled.');
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : 'Could not enable reminders.',
      );
    } finally {
      setLoading(false);
    }
  }

  async function disable() {
    setLoading(true);
    setStatus('');
    try {
      const registration = supported
        ? await navigator.serviceWorker.getRegistration()
        : undefined;
      const subscription = await registration?.pushManager.getSubscription();
      if (subscription) {
        await fetch('/api/notifications/subscription', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
        await subscription.unsubscribe();
      }
      await savePreferences(false);
      setEnabled(false);
      setStatus('Reminders are disabled.');
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : 'Could not disable reminders.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
      <div className="flex items-start justify-between gap-5">
        <div>
          <h2 className="font-semibold">Daily review reminder</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Server-scheduled Web Push. Delivery uses a daily window and remains
            optional.
          </p>
        </div>
        <span
          className={`mt-1 h-2.5 w-2.5 rounded-full ${enabled ? 'bg-emerald-300' : 'bg-slate-600'}`}
        />
      </div>
      <button
        disabled={loading}
        onClick={enabled ? disable : enable}
        className="mt-5 rounded-lg border border-white/15 px-4 py-2 text-sm hover:bg-white/[0.06] disabled:opacity-60"
      >
        {loading
          ? 'Saving…'
          : enabled
            ? 'Disable reminders'
            : 'Enable reminders'}
      </button>
      {status && (
        <p role="status" className="mt-3 text-xs leading-5 text-slate-400">
          {status}
        </p>
      )}
    </div>
  );
}
