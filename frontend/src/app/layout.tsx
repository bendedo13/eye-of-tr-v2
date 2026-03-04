import React from 'react';
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'EyeOfTR - Gelişmiş Arama Platformu',
  description: 'AlanSearch ve Konum Arama ile gelişmiş bilgi arama platformu',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body className="bg-slate-900 text-white">{children}</body>
    </html>
  );
}