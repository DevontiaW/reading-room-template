import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import Link from 'next/link';
import { UserMenu } from '@/components/UserMenu';
import { PlayerHealthBar } from '@/components/PlayerHealthBar';
import { LiquidBlobs } from '@/components/LiquidBlobs';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL('https://bookclub2k26.vercel.app'),
  title: 'C&W Book Club | The Reading Room',
  description: 'A private book club for Cameron and Will. Track reads, share thoughts, and pick your next adventure together.',
  keywords: ['book club', 'reading', 'books', 'discussion'],
  authors: [{ name: 'C&W Book Club' }],
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
  openGraph: {
    title: 'C&W Book Club | The Reading Room',
    description: 'A private book club for Cameron and Will. Track reads, share thoughts, and pick your next adventure together.',
    type: 'website',
    siteName: 'C&W Book Club',
    images: [
      {
        url: '/og-image.svg',
        width: 1200,
        height: 630,
        alt: 'C&W Book Club - The Reading Room',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'C&W Book Club | The Reading Room',
    description: 'A private book club for Cameron and Will.',
    images: ['/og-image.svg'],
  },
  robots: {
    index: false,
    follow: false,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#FFC300', // Vibrant gold
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* Liquid blob background */}
        <LiquidBlobs />

        <div className="relative min-h-screen flex flex-col">
          {/* Navigation - glass effect with vibrant accents */}
          <nav className="border-b border-brass/20 bg-walnut/80 backdrop-blur-xl sticky top-0 z-40">
            <div className="max-w-6xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
              <Link
                href="/"
                className="font-bold text-lg sm:text-xl text-brass hover:text-brass-light transition-colors text-glow-gold"
              >
                C&W Book Club
              </Link>
              <div className="flex items-center gap-1 sm:gap-3">
                <Link
                  href="/"
                  className="text-cream/60 hover:text-brass transition-colors px-2 sm:px-3 py-2 text-sm sm:text-base min-h-[44px] flex items-center"
                >
                  Home
                </Link>
                <Link
                  href="/books"
                  className="text-cream/60 hover:text-brass transition-colors px-2 sm:px-3 py-2 text-sm sm:text-base min-h-[44px] flex items-center"
                >
                  Library
                </Link>
                <PlayerHealthBar />
                <UserMenu />
              </div>
            </div>
          </nav>

          {/* Main content */}
          <main className="flex-1 relative">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
