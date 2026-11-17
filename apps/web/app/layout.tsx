import './globals.css';
import type { ReactNode } from 'react';
import type { Viewport } from 'next';
import {
  DARK_CANVAS_HEX,
  LIGHT_CANVAS_HEX,
  THEME_INIT_SCRIPT,
} from '../lib/theme';

export const metadata = {
  title: 'AlgoFlow',
  description:
    'A personal algorithm learning system with interactive lessons and spaced review.',
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: LIGHT_CANVAS_HEX },
    { media: '(prefers-color-scheme: dark)', color: DARK_CANVAS_HEX },
  ],
  colorScheme: 'light dark',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-screen bg-canvas text-ink antialiased">
        {children}
      </body>
    </html>
  );
}
