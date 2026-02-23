import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'sonner';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { AuthProvider } from '@/hooks/use-auth';
import { PWAInstallBanner } from '@/components/pwa-install-prompt';
import { SEOOptimizer } from '@/components/seo-optimizer';
// import { FavoritesProvider } from '@/hooks/use-favorites';
// import { PaymentMethodsProvider } from '@/hooks/use-payment-methods';
// import { AgeVerificationProvider } from '@/hooks/use-age-verification';

export const metadata: Metadata = {
  title: 'Book My Table - Discover & Reserve Amazing Restaurants',
  description: 'Find and book the best restaurants in London with real-time availability, reviews, and exclusive deals. Discover your next dining experience today.',
  keywords: ['restaurants', 'dining', 'reservations', 'London', 'food', 'booking', 'restaurant booking', 'table reservation'],
  authors: [{ name: 'Book My Table' }],
  creator: 'Book My Table',
  publisher: 'Book My Table',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://bookmytable.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Book My Table - Discover & Reserve Amazing Restaurants',
    description: 'Find and book the best restaurants in London with real-time availability, reviews, and exclusive deals.',
    url: 'https://bookmytable.com',
    siteName: 'Book My Table',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Book My Table - Restaurant Booking Platform',
      },
    ],
    locale: 'en_GB',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Book My Table - Discover & Reserve Amazing Restaurants',
    description: 'Find and book the best restaurants in London with real-time availability, reviews, and exclusive deals.',
    images: ['/og-image.jpg'],
    creator: '@bookmytable',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#3b82f6" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Book My Table" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      </head>
      <body
        className="font-body antialiased bg-background text-foreground min-h-screen"
        suppressHydrationWarning
      >
        <AuthProvider>
          <PWAInstallBanner />
          <Header />
          <main className="min-h-[calc(100vh-8rem)]">{children}</main>
          <Footer />
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
