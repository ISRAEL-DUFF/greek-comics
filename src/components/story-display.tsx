'use client';

import React, { useRef } from 'react';
import Image from 'next/image';
import { useReactToPrint } from 'react-to-print';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Download, AlertCircle, BookOpen } from 'lucide-react';
import type { StoryResult } from '@/app/actions';
import { WordGloss } from './word-gloss';

interface StoryDisplayProps {
  storyResult: StoryResult | null;
  isLoading: boolean;
}

const splitIntoSentences = (text: string): string[] => {
  return text.match(/[^.!?]+[.!?]*/g) || [];
};

export function StoryDisplay({ storyResult, isLoading }: StoryDisplayProps) {
  const storyContentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    content: () => storyContentRef.current,
    documentTitle: 'Hellenika-Komiks-Story',
  });

  if (isLoading) {
    return (
      <div className="space-y-8">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="overflow-hidden shadow-md">
            <Skeleton className="h-64 w-full" />
            <CardContent className="p-6">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="mt-2 h-4 w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (storyResult?.error) {
    return (
      <Card className="flex flex-col items-center justify-center p-8 text-center">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <h3 className="mt-4 text-xl font-semibold">Generation Failed</h3>
        <p className="mt-2 text-muted-foreground">{storyResult.error}</p>
      </Card>
    );
  }

  if (!storyResult?.data) {
    return (
      <Card className="flex flex-col items-center justify-center p-8 text-center border-dashed">
        <BookOpen className="h-16 w-16 text-muted-foreground/50" />
        <h3 className="mt-4 text-xl font-semibold font-headline">Your Story Awaits</h3>
        <p className="mt-2 text-muted-foreground">Use the form to generate your first illustrated Ancient Greek story.</p>
      </Card>
    );
  }
  
  const sentences = splitIntoSentences(storyResult.data.story);

  return (
    <div>
       <div className="no-print mb-4 flex justify-end">
        <Button onClick={handlePrint}>
          <Download className="mr-2 h-4 w-4" />
          Save as PDF
        </Button>
      </div>
      <div ref={storyContentRef} id="story-content" className="printable-area space-y-8">
        {sentences.map((sentence, index) => (
          <Card key={index} className="print-card overflow-hidden shadow-lg print:shadow-none transition-shadow duration-300 hover:shadow-xl">
             {storyResult.data?.illustrations?.[index] && (
              <div className="relative aspect-video w-full">
                <Image
                  src={storyResult.data.illustrations[index]}
                  alt={`Illustration for: ${sentence}`}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover"
                  data-ai-hint="ancient greece story"
                />
              </div>
            )}
            <CardContent className="p-6">
              <p className="text-xl leading-relaxed lang-grc">
                {sentence.split(' ').map((word, i) => (
                   <WordGloss key={i} word={word} />
                ))}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
