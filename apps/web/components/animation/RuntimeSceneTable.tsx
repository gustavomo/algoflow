'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import type {
  RuntimeSceneRegion,
  RuntimeSceneTableRow,
  RuntimeSceneTableView,
} from '@algoflow/contracts';
import { INSTANT } from '../../lib/animation/runtimeSceneMotion';
import {
  tableLinkPath,
  type LinkRect,
} from '../../lib/animation/runtimeSceneGeometry';
import {
  CELL_STATE_VAR,
  TONE_VAR,
  tone,
} from '../../lib/animation/runtimeSceneTone';

const useIsomorphicLayoutEffect =
  typeof window === 'undefined' ? useEffect : useLayoutEffect;

const rowKey = (regionId: string, rowId: string) => `${regionId}:${rowId}`;

interface DrawnLink {
  key: string;
  d: string;
  end: { x: number; y: number };
  /** Theme variable of the source row's state; null for a resting link. */
  variable: string | null;
  orphan: boolean;
}

function Table({
  region,
  view,
  active,
  reduced,
}: {
  region: RuntimeSceneRegion;
  view: RuntimeSceneTableView;
  active: boolean;
  reduced: boolean;
}) {
  const variable = TONE_VAR[region.tone];
  // Rows already on screen do not fade in again when another row changes.
  const seen = useRef(new Set(view.rows.map((row) => row.id)));
  useEffect(() => {
    seen.current = new Set(view.rows.map((row) => row.id));
  }, [view]);
  const cellStyle = (row: RuntimeSceneTableRow, column: number) => {
    const stateVar = row.state ? CELL_STATE_VAR[row.state] : null;
    const marked = stateVar && (!row.focus || row.focus.includes(column));
    return {
      background: marked ? tone(stateVar, 0.16) : 'transparent',
      color:
        row.state === 'visited' ? tone('--color-faint') : tone('--color-ink'),
      boxShadow: marked ? `inset 0 0 0 1px ${tone(stateVar, 0.7)}` : 'none',
    };
  };
  return (
    <section
      aria-label={`Table ${region.label}`}
      data-region={region.id}
      data-table
      data-active={active || undefined}
      className="min-w-0 rounded-lg border transition-[border-color,background-color] duration-300"
      style={{
        borderColor: tone(variable, active ? 0.75 : 0.28),
        background: tone(variable, active ? 0.06 : 0.025),
      }}
    >
      <header className="flex items-center justify-between gap-2 px-2 pt-1.5 sm:px-3 sm:pt-2">
        <span
          className="font-mono text-xs font-semibold tracking-[0.02em]"
          style={{ color: tone(variable) }}
        >
          {region.label}
        </span>
        <span className="font-mono text-[11px] text-faint">
          {view.rows.length} {view.rows.length === 1 ? 'row' : 'rows'}
        </span>
      </header>
      <div className="p-1.5 sm:p-2">
        <table className="w-full border-collapse font-mono text-xs">
          <thead>
            <tr>
              {view.columns.map((column) => (
                <th
                  key={column.label}
                  scope="col"
                  className="border-b border-line-strong px-1.5 py-1 text-left font-semibold text-subtle"
                >
                  <span className="[overflow-wrap:anywhere]">
                    {column.label}
                  </span>
                  {column.key && (
                    <span
                      data-key={column.key}
                      className="ml-1 inline-block rounded border px-1 align-middle text-[10px] uppercase leading-4"
                      style={{
                        borderColor: tone(variable, 0.6),
                        color: tone(variable),
                      }}
                    >
                      {column.key}
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {view.rows.map((row) => (
              <motion.tr
                key={row.id}
                data-table-row={rowKey(region.id, row.id)}
                data-row-state={row.state ?? 'default'}
                initial={
                  seen.current.has(row.id) || reduced ? false : { opacity: 0 }
                }
                animate={{ opacity: 1 }}
                transition={reduced ? INSTANT : { duration: 0.35 }}
              >
                {row.cells.map((cell, column) => (
                  <td
                    key={column}
                    className="border-b border-line px-1.5 py-1.5 transition-[background-color,box-shadow,color] duration-300 [overflow-wrap:anywhere]"
                    style={cellStyle(row, column)}
                  >
                    {cell}
                  </td>
                ))}
              </motion.tr>
            ))}
            {view.rows.length === 0 && (
              <tr>
                <td
                  colSpan={view.columns.length}
                  className="px-1.5 py-2 text-center text-faint"
                >
                  no rows
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/**
 * Every table that exists at this step, with the foreign-key references
 * between their rows drawn as curves over them. A table without a view has
 * not been created yet, or was dropped, and is not drawn.
 */
export function TableRegions({
  regions,
  views,
  activeIds,
  reduced,
}: {
  regions: RuntimeSceneRegion[];
  views: RuntimeSceneTableView[];
  activeIds: Set<string>;
  reduced: boolean;
}) {
  const shown = regions.flatMap((region) => {
    const view = views.find((item) => item.regionId === region.id);
    return view ? [{ region, view }] : [];
  });
  const linked = shown.some(({ view }) => view.rows.some((row) => row.link));
  const host = useRef<HTMLDivElement>(null);
  const [links, setLinks] = useState<DrawnLink[]>([]);
  useIsomorphicLayoutEffect(() => {
    const node = host.current;
    if (!node) return;
    const measure = () => {
      const frame = node.getBoundingClientRect();
      const rect = (key: string): LinkRect | null => {
        const row = node.querySelector(`[data-table-row="${key}"]`);
        if (!row) return null;
        const box = row.getBoundingClientRect();
        return {
          left: box.left - frame.left,
          right: box.right - frame.left,
          top: box.top - frame.top,
          bottom: box.bottom - frame.top,
        };
      };
      const next = views.flatMap((view) =>
        view.rows.flatMap((row): DrawnLink[] => {
          if (!row.link) return [];
          const source = rect(rowKey(view.regionId, row.id));
          if (!source) return [];
          const target = rect(rowKey(row.link.regionId, row.link.rowId));
          return [
            {
              key: rowKey(view.regionId, row.id),
              ...tableLinkPath(source, target),
              variable: row.state ? CELL_STATE_VAR[row.state] : null,
              orphan: !target,
            },
          ];
        }),
      );
      setLinks((current) =>
        JSON.stringify(current) === JSON.stringify(next) ? current : next,
      );
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [views]);

  if (shown.length === 0) return null;
  return (
    <div
      ref={host}
      data-tables
      className={`relative grid gap-2 ${linked ? 'pr-6 sm:gap-10 sm:pr-0' : 'sm:gap-3'} ${shown.length > 1 ? 'sm:grid-cols-2' : ''}`}
    >
      {shown.map(({ region, view }) => (
        <Table
          key={region.id}
          region={region}
          view={view}
          active={activeIds.has(region.id)}
          reduced={reduced}
        />
      ))}
      <svg
        aria-hidden
        data-table-links
        className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
      >
        {links.map((link) => {
          const stroke = link.orphan
            ? tone('--color-danger')
            : link.variable
              ? tone(link.variable)
              : tone('--color-muted', 0.7);
          return (
            <g key={link.key} data-link={link.orphan ? 'orphan' : 'resolved'}>
              <path
                d={link.d}
                fill="none"
                stroke={stroke}
                strokeWidth={link.variable || link.orphan ? 2 : 1.25}
                strokeDasharray={link.orphan ? '3 3' : undefined}
                strokeLinecap="round"
              />
              {link.orphan ? (
                <path
                  d={`M ${link.end.x - 4} ${link.end.y - 4} l 8 8 m 0 -8 l -8 8`}
                  stroke={stroke}
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              ) : (
                <circle cx={link.end.x} cy={link.end.y} r="3" fill={stroke} />
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
