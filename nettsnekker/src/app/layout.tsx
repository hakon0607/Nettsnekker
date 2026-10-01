import type { Metadata, Viewport } from 'next';
import './globals.css';

const URL_ = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(URL_),
  title: { default: 'Nettsnekker – nettside til bedriften din, betal når du er fornøyd', template: '%s · Nettsnekker' },
  description:
    'Bestill en skreddersydd nettside på fem minutter. Velg farger og innhold, se utkastet, og betal resten først når du er fornøyd. Med eget domene og adminside.',
  openGraph: { type: 'website', locale: 'nb_NO', title: 'Nettsnekker', description: 'Vi snekrer nettsiden din. Du betaler når du er fornøyd.' },
  icons: { icon: '/icon.svg' },
};

export const viewport: Viewport = { themeColor: '#1F6F5C', width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nb" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500..800&family=Figtree:wght@400..700&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
