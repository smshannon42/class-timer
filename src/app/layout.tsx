import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Ford Middle School PE Timer',
  description: 'Physical Education and Athletics Interval Timer',
};

export const viewport: Viewport = {
  themeColor: '#020b1c',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#020b1c] text-white antialiased selection:bg-[#0047BA]">
        {children}
      </body>
    </html>
  );
}
