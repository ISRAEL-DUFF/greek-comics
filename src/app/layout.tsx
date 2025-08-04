import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Hellenika Komiks',
  description: 'Ancient Greek Illustrated Story Generator',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Gentium+Book+Plus:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <div className="absolute top-4 right-4 z-20 no-print">
          <Link href="/word-expansion" className="text-sm text-muted-foreground hover:text-primary underline">
            Word Expansion Tool
          </Link>
        </div>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
