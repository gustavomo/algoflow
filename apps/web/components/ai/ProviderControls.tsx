'use client';

import { useEffect, useMemo, useState } from 'react';
import type {
  AIEffort,
  AIProviderCatalog,
  AIProviderId,
  AIProviderSelection,
} from '@algoflow/contracts';

export default function ProviderControls({
  value,
  onChange,
  disabled = false,
  idPrefix,
}: {
  value?: AIProviderSelection;
  onChange: (selection: AIProviderSelection) => void;
  disabled?: boolean;
  idPrefix: string;
}) {
  const [catalog, setCatalog] = useState<AIProviderCatalog>();

  useEffect(() => {
    const controller = new AbortController();
    void fetch('/api/ai/providers', { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error('Provider discovery failed.');
        return (await response.json()) as AIProviderCatalog;
      })
      .then(setCatalog)
      .catch(() => undefined);
    return () => controller.abort();
  }, []);

  const available = useMemo(
    () => catalog?.providers.filter((provider) => provider.available) ?? [],
    [catalog],
  );
  const selection = value ?? catalog?.defaultSelection;
  const selected = available.find(
    (provider) => provider.id === selection?.provider,
  );

  useEffect(() => {
    if (!catalog || value) return;
    onChange(catalog.defaultSelection);
  }, [catalog, onChange, value]);

  if (!catalog || !selection || !selected) return null;
  const configurable =
    available.length > 1 ||
    selected.models.length > 1 ||
    selected.efforts.length > 0;
  if (!configurable) return null;

  function selectProvider(provider: AIProviderId) {
    const capability = available.find((item) => item.id === provider);
    if (!capability) return;
    onChange({
      provider,
      model: capability.defaultModel,
      effort: capability.defaultEffort,
    });
  }

  return (
    <fieldset
      disabled={disabled}
      className="mt-4 border-y border-line py-3 disabled:opacity-60"
    >
      <legend className="px-2 font-mono text-[9px] uppercase tracking-[0.18em] text-faint">
        Answer configuration
      </legend>
      <div className="grid gap-3 sm:grid-cols-3">
        <label
          htmlFor={`${idPrefix}-provider`}
          className="text-[11px] text-subtle"
        >
          Provider
          <select
            id={`${idPrefix}-provider`}
            value={selection.provider}
            onChange={(event) =>
              selectProvider(event.target.value as AIProviderId)
            }
            className="mt-1 block w-full rounded-lg border border-line bg-canvas px-2 py-2 text-xs text-ink"
          >
            {available.map((provider) => (
              <option key={provider.id} value={provider.id}>
                {provider.label}
              </option>
            ))}
          </select>
        </label>
        <label
          htmlFor={`${idPrefix}-model`}
          className="text-[11px] text-subtle"
        >
          Model
          <select
            id={`${idPrefix}-model`}
            value={selection.model ?? selected.defaultModel}
            onChange={(event) =>
              onChange({ ...selection, model: event.target.value })
            }
            className="mt-1 block w-full rounded-lg border border-line bg-canvas px-2 py-2 text-xs text-ink"
          >
            {selected.models.map((model) => (
              <option key={model} value={model}>
                {model}
              </option>
            ))}
          </select>
        </label>
        {selected.efforts.length > 0 ? (
          <label
            htmlFor={`${idPrefix}-effort`}
            className="text-[11px] text-subtle"
          >
            Effort
            <select
              id={`${idPrefix}-effort`}
              value={selection.effort ?? selected.defaultEffort}
              onChange={(event) =>
                onChange({
                  ...selection,
                  effort: event.target.value as AIEffort,
                })
              }
              className="mt-1 block w-full rounded-lg border border-line bg-canvas px-2 py-2 text-xs text-ink"
            >
              {selected.efforts.map((effort) => (
                <option key={effort} value={effort}>
                  {effort}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <p className="self-end pb-2 text-[10px] leading-4 text-faint">
            Fixed effort for this provider
          </p>
        )}
      </div>
      {(selection.provider === 'codex-cli' ||
        selection.provider === 'claude-cli') && (
        <p className="mt-2 text-[10px] leading-4 text-faint">
          Runs on this API server. The CLI still contacts its remote model
          service.
        </p>
      )}
    </fieldset>
  );
}
