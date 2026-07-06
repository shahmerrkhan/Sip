import { ClerkProvider } from '@clerk/nextjs';
import { dark } from '@clerk/themes';
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Sip — find your people',
  description: 'Real conversations, zero cold messages.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider appearance={{
      theme: dark,
      variables: { colorPrimary: '#0A66C2', colorBackground: '#161B22' },
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