'use client';

import { useState } from 'react';
import { BookGeneratorForm } from './components/book-generator-form';
import { BookDisplay } from './components/book-display';
import type { BookResult } from './actions';

export default function BookGeneratorPage() {
  const [bookResult, setBookResult] = useState<BookResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className="flex min-h-screen w-full flex-col bg-background text-foreground">
      <main className="container mx-auto flex-1 px-4 py-8">
        <div className="text-center mb-12">
            <h1 className="font-headline text-4xl font-bold text-primary">Book Generator</h1>
            <p className="mt-1 text-lg text-muted-foreground">Generate a complete, illustrated book in Ancient Greek.</p>
        </div>
        <div className="grid gap-12 lg:grid-cols-12">
          <aside className="no-print lg:col-span-4 xl:col-span-3">
             <div className="sticky top-24 space-y-8">
                <BookGeneratorForm
                    setBookResult={setBookResult}
                    setIsLoading={setIsLoading}
                    isLoading={isLoading}
                />
             </div>
          </aside>
          <div className="lg:col-span-8 xl:col-span-9">
            <BookDisplay
              bookResult={bookResult} 
              isLoading={isLoading}
            />
          </div>
        </div>
      </main>
      <footer className="no-print py-6 text-center text-sm text-muted-foreground">
        <p>Built with Next.js and Genkit. Illustrations and stories are AI-generated.</p>
      </footer>
    </div>
  );
}
