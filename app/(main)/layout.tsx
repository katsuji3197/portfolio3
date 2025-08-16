import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { Noto_Sans_JP } from 'next/font/google';
import { Analytics } from '@vercel/analytics/react';
import './globals.css';
import Header from '../../components/header';
import NightSky from '../../components/night-sky';
import CustomCursor from '../../components/custom-cursor';
import { CursorProvider } from '../../contexts/cursor-context';

const customFont = localFont({
  src: '../../public/font.ttf',
  variable: '--font-custom',
  display: 'swap',
});

const notoSansJP = Noto_Sans_JP({
  variable: '--font-noto-sans-jp',
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'N.Motoki Portfolio 3.0',
  description: 'The Third Portfolio of NAKATSUJI Motoki.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="jp" className="thin-dark-scrollbar">
      <body
        className={`${customFont.variable} ${notoSansJP.variable} antialiased`}
      >
        <CursorProvider>
          <CustomCursor />
          <Header />
          <NightSky />
          <main className="relative z-10">{children}</main>
          <Analytics />
        </CursorProvider>
      </body>
    </html>
  );
}
