import './globals.css';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'AlgoFlow',
  description:
    'A personal algorithm learning system with interactive lessons and spaced review.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#061015] text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}
