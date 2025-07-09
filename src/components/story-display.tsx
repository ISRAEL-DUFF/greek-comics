'use client';

import React, { useRef, useState } from 'react';
import ReactToPrint from 'react-to-print';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, BookOpen, Save, Loader2, Download } from 'lucide-react';
import type { StoryResult } from '@/app/actions';
import { WordGloss } from './word-gloss';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { saveStoryAction } from '@/app/actions';

interface StoryDisplayProps {
  storyResult: StoryResult | null;
  isLoading: boolean;
}

export function StoryDisplay({ storyResult, isLoading }: StoryDisplayProps) {
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const storyContentRef = useRef<HTMLDivElement>(null);

  const handleSaveStory = async () => {
    if (!storyResult?.data) return;

    setIsSaving(true);
    const result = await saveStoryAction(storyResult.data);
    setIsSaving(false);

    if (result.success) {
      toast({
        title: 'Story Saved!',
        description: 'Your story has been successfully saved.',
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'Save Failed',
        description: result.error,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-16">
        {[...Array(3)].map((_, i) => {
          const isImageRight = i % 2 === 0;
          return (
            <div key={i} className="flex flex-col md:flex-row gap-8 items-center">
              <div
                className={cn(
                  'w-full md:w-1/2',
                  isImageRight ? 'md:order-2' : 'md:order-1'
                )}
              >
                <Skeleton className="w-full aspect-square rounded-lg" />
              </div>
              <div
                className={cn(
                  'w-full md:w-1/2 space-y-3',
                  isImageRight ? 'md:order-1' : 'md:order-2'
                )}
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

  const { sentences, story, illustrations } = storyResult.data;

  return (
    <div className="space-y-8">
      <div className="no-print flex justify-end gap-2">
         <ReactToPrint
          trigger={() => (
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
          )}
          content={() => storyContentRef.current}
          documentTitle={story.substring(0, 30) || 'Ancient Greek Story'}
        />
        <Button onClick={handleSaveStory} disabled={isSaving || isLoading} className="bg-accent text-accent-foreground hover:bg-accent/90">
          {isSaving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          {isSaving ? 'Saving...' : 'Save Story'}
        </Button>
      </div>
      <div ref={storyContentRef} className="space-y-16">
        {sentences.map((sentence, index) => {
          const illustration = illustrations?.[index];
          const isImageRight = index % 2 === 0;

          return (
            <div
              key={index}
              className="story-item flex flex-col md:flex-row gap-8 items-center"
            >
              {illustration && (
                <div
                  className={cn(
                    'w-full md:w-1/2',
                    isImageRight ? 'md:order-2' : 'md:order-1'
                  )}
                >
                  <Image
                    src={illustration}
                    alt={`Illustration for: ${sentence}`}
                    width={600}
                    height={600}
                    className="rounded-lg object-cover shadow-lg aspect-square mx-auto"
                    data-ai-hint="ancient greece story"
                    unoptimized
                  />
                </div>
              )}
              <div
                className={cn(
                  'w-full md:w-1/2',
                  isImageRight ? 'md:order-1' : 'md:order-2'
                )}
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
    </div>
  );
}
