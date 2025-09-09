export const metadata = {
  title: 'Pirate Upload',
  description: 'Avatar uploader with Vercel Blob',
};

import './globals.css';
import React from 'react';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

