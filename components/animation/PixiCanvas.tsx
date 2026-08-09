'use client';
import { useEffect, useRef } from 'react';
import { Application } from 'pixi.js';

export default function PixiCanvas() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const app = new Application({ width: 200, height: 200, background: '#ffffff' });
    ref.current.appendChild(app.view as any);
    return () => app.destroy(true, true);
  }, []);
  return <div ref={ref} />;
}
