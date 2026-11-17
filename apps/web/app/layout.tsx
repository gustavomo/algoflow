import './globals.css';
import type { ReactNode } from 'react';
import type { Viewport } from 'next';
import { DARK_CANVAS_HEX } from '../lib/theme';

export const metadata = {
  title: 'AlgoFlow',
  description:
    'A personal algorithm learning system with interactive lessons and spaced review.',
};

export const viewport: Viewport = {
  themeColor: DARK_CANVAS_HEX,
  colorScheme: 'dark',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-canvas text-ink antialiased">
        {children}
      </body>
    </html>
  );
}
