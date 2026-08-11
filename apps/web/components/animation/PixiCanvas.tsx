'use client';

import { useEffect, useRef } from 'react';
import { Application, Graphics } from 'pixi.js';

function renderGrid(app: Application, mode: 'bfs' | 'dfs', step: number) {
  app.stage.removeChildren();
  const size = 5;
  const cell = 42;
  const offset = 16;
  const order =
    mode === 'bfs'
      ? [12, 7, 11, 13, 17, 2, 6, 8, 10, 14, 16, 18, 22]
      : [12, 7, 2, 1, 0, 5, 10, 15, 20, 21, 22];
  const visited = new Set(order.slice(0, Math.min(order.length, step + 1)));
  for (let index = 0; index < size * size; index += 1) {
    const row = Math.floor(index / size);
    const column = index % size;
    const active = order[Math.min(step, order.length - 1)] === index;
    const graphic = new Graphics()
      .roundRect(offset + column * cell, offset + row * cell, 34, 34, 7)
      .fill(active ? 0xfafaf9 : visited.has(index) ? 0x737373 : 0x181818)
      .stroke({
        width: active ? 3 : 1,
        color: active ? 0xffffff : visited.has(index) ? 0xd4d4d4 : 0x525252,
        alpha: 0.8,
      });
    app.stage.addChild(graphic);
    if (visited.has(index) && !active) {
      app.stage.addChild(
        new Graphics()
          .circle(offset + column * cell + 17, offset + row * cell + 17, 3)
          .fill(0xf5f5f5),
      );
    }
  }
}

export default function PixiCanvas({
  mode,
  step,
}: {
  mode: 'bfs' | 'dfs';
  step: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);
  const modeRef = useRef(mode);
  const stepRef = useRef(step);

  useEffect(() => {
    let cancelled = false;
    const app = new Application();
    void app
      .init({ width: 244, height: 244, background: '#0f0f0f', antialias: true })
      .then(() => {
        if (cancelled) {
          app.destroy(true);
          return;
        }
        appRef.current = app;
        containerRef.current?.appendChild(app.canvas);
        renderGrid(app, modeRef.current, stepRef.current);
      });
    return () => {
      cancelled = true;
      if (appRef.current === app) appRef.current = null;
      app.destroy(true);
    };
  }, []);

  useEffect(() => {
    modeRef.current = mode;
    stepRef.current = step;
    if (appRef.current) renderGrid(appRef.current, mode, step);
  }, [mode, step]);

  return (
    <div className="rounded-[1.75rem] border border-line bg-surface p-6">
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-soft">
        PixiJS grid scaffold · {mode.toUpperCase()} frontier
      </p>
      <div
        ref={containerRef}
        className="mt-5 flex min-h-[244px] justify-center overflow-hidden rounded-xl"
      />
    </div>
  );
}
