import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import Link from 'next/link';
import { Book, MessageSquare, StickyNote, Menu, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';

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
          <header className="no-print sticky top-0 z-30 w-full border-b bg-background/95 backdrop-blur-sm">
            <div className="container mx-auto flex h-14 items-center justify-between">
              <Link href="/" className="flex items-center gap-2">
                <Book className="h-6 w-6 text-primary" />
                <span className="font-headline text-xl font-bold text-primary">Hellenika Komiks</span>
              </Link>
              {/* Desktop Navigation */}
              <nav className="hidden items-center gap-2 md:flex">
                <Button variant="ghost" asChild>
                  <Link href="/">
                    <LayoutDashboard className="mr-2 h-4 w-4"/>
                    Dashboard
                  </Link>
                </Button>
                <Button variant="ghost" asChild>
                  <Link href="/story-generator">
                    <MessageSquare className="mr-2 h-4 w-4"/>
                    Story Generator
                  </Link>
                </Button>
                <Button variant="ghost" asChild>
                  <Link href="/book-generator">
                    <Book className="mr-2 h-4 w-4"/>
                    Book Generator
                  </Link>
                </Button>
                <Button variant="ghost" asChild>
                   <Link href="/word-expansion">
                    <StickyNote className="mr-2 h-4 w-4"/>
                    Word Expansion
                  </Link>
                </Button>
                <Button variant="ghost" asChild>
                   <Link href="/notes">
                    <StickyNote className="mr-2 h-4 w-4"/>
                    Notes
                  </Link>
                </Button>
              </nav>
              {/* Mobile Navigation */}
              <div className="md:hidden">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="icon">
                      <Menu className="h-6 w-6" />
                      <span className="sr-only">Open navigation menu</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left">
                    <SheetHeader className="sr-only">
                      <SheetTitle>Navigation Menu</SheetTitle>
                      <SheetDescription>Main navigation links for the application.</SheetDescription>
                    </SheetHeader>
                    <div className="flex flex-col gap-4 py-8">
                       <Link href="/" className="flex items-center gap-2 pb-4 border-b">
                          <Book className="h-6 w-6 text-primary" />
                          <span className="font-headline text-xl font-bold text-primary">Hellenika Komiks</span>
                        </Link>
                        <Button variant="ghost" className="justify-start text-lg" asChild>
                          <Link href="/">
                            <LayoutDashboard className="mr-2 h-5 w-5"/>
                            Dashboard
                          </Link>
                        </Button>
                      <Button variant="ghost" className="justify-start text-lg" asChild>
                        <Link href="/story-generator">
                          <MessageSquare className="mr-2 h-5 w-5"/>
                          Story Generator
                        </Link>
                      </Button>
                      <Button variant="ghost" className="justify-start text-lg" asChild>
                        <Link href="/book-generator">
                          <Book className="mr-2 h-5 w-5"/>
                          Book Generator
                        </Link>
                      </Button>
                      <Button variant="ghost" className="justify-start text-lg" asChild>
                         <Link href="/word-expansion">
                          <StickyNote className="mr-2 h-5 w-5"/>
                          Word Expansion
                        </Link>
                      </Button>
                      <Button variant="ghost" className="justify-start text-lg" asChild>
                         <Link href="/notes">
                          <StickyNote className="mr-2 h-5 w-5"/>
                          Notes
                        </Link>
                      </Button>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          </header>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
