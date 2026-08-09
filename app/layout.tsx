import './globals.css';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'AlgoFlow',
  description: 'Interactive algorithm lessons with animations and AI',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-gray-900">
        {children}
      </body>
    </html>
  );
}
