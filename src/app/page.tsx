'use client';

import { useState } from 'react';
import { StoryGeneratorForm } from '@/components/story-generator-form';
import { StoryDisplay } from '@/components/story-display';
import type { StoryResult } from '@/app/actions';

export default function Home() {
  const [storyResult, setStoryResult] = useState<StoryResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="no-print sticky top-0 z-10 border-b bg-background/80 py-4 backdrop-blur-sm">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-headline text-4xl font-bold text-primary">Ἑλληνικὰ Κόμιξ</h1>
          <p className="mt-1 text-lg text-muted-foreground">Ancient Greek Illustrated Story Generator</p>
        </div>
      </header>
      <main className="container mx-auto flex-1 px-4 py-8">
        <div className="grid gap-12 lg:grid-cols-12">
          <aside className="no-print lg:col-span-4 xl:col-span-3">
             <div className="sticky top-24">
                <StoryGeneratorForm 
                  setStoryResult={setStoryResult} 
                  setIsLoading={setIsLoading} 
                  isLoading={isLoading} 
                />
             </div>
          </aside>
          <div className="lg:col-span-8 xl:col-span-9">
            <StoryDisplay storyResult={storyResult} isLoading={isLoading} />
          </div>
        </div>
      </main>
      <footer className="no-print py-6 text-center text-sm text-muted-foreground">
        <p>Built with Next.js and Genkit. Illustrations and stories are AI-generated.</p>
      </footer>
    </div>
  );
}
