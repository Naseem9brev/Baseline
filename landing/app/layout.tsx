import type { Metadata } from 'next';
import '@fontsource/spectral/500.css';
import '@fontsource/spectral/600.css';
import '@fontsource/hanken-grotesk/400.css';
import '@fontsource/hanken-grotesk/500.css';
import '@fontsource/hanken-grotesk/600.css';
import '@fontsource/hanken-grotesk/700.css';
import './globals.css';

export const metadata: Metadata = {
  title: 'Baseline — your daily 60-second health check-in',
  description:
    'A private, on-device daily check-in for eyes, voice, and reaction. Track your baseline over time. 100% on your device.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
