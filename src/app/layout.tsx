import { ClerkProvider } from '@clerk/nextjs';
import { dark } from '@clerk/themes';
import type { Metadata } from 'next';
import { ACCENT, BG } from '@/lib/theme';
import './globals.css';;

export const metadata: Metadata = {
  title: 'Sip — find your people',
  description: 'Real conversations, zero cold messages.',
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider appearance={{
      theme: dark,
      variables: {
        colorPrimary: ACCENT,
        colorBackground: BG,
        borderRadius: '10px',
      },
    }}>
    <html lang="en">
        <head>
          <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />
        </head>
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}