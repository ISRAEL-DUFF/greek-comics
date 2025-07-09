'use client';

import React from 'react';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, BookOpen } from 'lucide-react';
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
  if (isLoading) {
    return (
      <div className="space-y-12">
        {[...Array(3)].map((_, i) => {
          const isImageRight = i % 2 === 0;
          return (
            <div key={i} className="flex flex-col md:flex-row gap-8 items-start">
              <div
                className={`w-full md:w-1/3 lg:w-1/4 ${
                  isImageRight ? 'md:order-2' : 'md:order-1'
                }`}
              >
                <Skeleton className="w-full aspect-square rounded-lg" />
              </div>
              <div
                className={`flex-1 space-y-3 ${
                  isImageRight ? 'md:order-1' : 'md:order-2'
                }`}
              >
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-5/6" />
                <Skeleton className="h-5 w-3/4" />
              </div>
            </div>
          );
        })}
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
        <h3 className="mt-4 text-xl font-semibold font-headline">
          Your Story Awaits
        </h3>
        <p className="mt-2 text-muted-foreground">
          Use the form to generate your first illustrated Ancient Greek story.
        </p>
      </Card>
    );
  }

  const sentences = splitIntoSentences(storyResult.data.story);

  return (
    <div className="space-y-16">
      {sentences.map((sentence, index) => {
        const illustration = storyResult.data?.illustrations?.[index];
        const isImageRight = index % 2 === 0;

        return (
          <div
            key={index}
            className="flex flex-col md:flex-row gap-8 items-start"
          >
            {illustration && (
              <div
                className={`w-full md:w-1/3 lg:w-1/4 ${
                  isImageRight ? 'md:order-2' : 'md:order-1'
                }`}
              >
                <Image
                  src={illustration}
                  alt={`Illustration for: ${sentence}`}
                  width={400}
                  height={400}
                  className="rounded-lg object-cover shadow-lg aspect-square mx-auto"
                  data-ai-hint="ancient greece story"
                  unoptimized
                />
              </div>
            )}
            <div
              className={`flex-1 ${isImageRight ? 'md:order-1' : 'md:order-2'}`}
            >
              <p className="text-xl lg:text-2xl leading-relaxed lg:leading-loose lang-grc font-body">
                {sentence.split(' ').map((word, i) => (
                  <WordGloss key={i} word={word} />
                ))}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
