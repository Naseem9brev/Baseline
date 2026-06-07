import type { Metadata } from 'next';
import Script from 'next/script';
import '@fontsource/spectral/400.css';
import '@fontsource/spectral/500.css';
import '@fontsource/spectral/600.css';
import '@fontsource/spectral/400-italic.css';
import '@fontsource/spectral/500-italic.css';
import '@fontsource/hanken-grotesk/400.css';
import '@fontsource/hanken-grotesk/500.css';
import '@fontsource/hanken-grotesk/600.css';
import '@fontsource/hanken-grotesk/700.css';
import './globals.css';

export const metadata: Metadata = {
  title: 'Baseline — Know your baseline. 60 seconds a day, on your device.',
  description:
    'Baseline is a daily health check-in. Three 60-second stations — Eyes, Voice, Reaction — build a daily baseline, a growing streak, and trends you can take to your doctor. Your data stays on your device.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Reveal-on-scroll only hides content when JS is confirmed (no FOUC / no-JS safe). */}
        <Script id="js-flag" strategy="beforeInteractive">
          {`document.documentElement.classList.add('js')`}
        </Script>
      </head>
      <body>{children}</body>
    </html>
  );
}
