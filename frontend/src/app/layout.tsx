import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'UPI Digital Assets',
  description: 'Blockchain-Based Digital Asset Transparency System with INR Payment',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-dark-900 min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}