
'use client';

import React, { useRef, useState } from 'react';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, BookOpen, Save, Loader2, Download, FileJson, Info } from 'lucide-react';
import type { StoryResult } from '@/app/actions';
import { WordGloss } from './word-gloss';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { saveStoryAction } from '@/app/actions';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"


interface StoryDisplayProps {
  storyResult: StoryResult | null;
  isLoading: boolean;
  onStorySaved: () => void;
}

// Supabase is checked in the action, but we can disable the button here too
const isSupabaseEnabled = !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;


export function StoryDisplay({ storyResult, isLoading, onStorySaved }: StoryDisplayProps) {
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
        description: 'Your story has been successfully saved to the cloud.',
      });
      onStorySaved();
    } else {
      toast({
        variant: 'destructive',
        title: 'Save Failed',
        description: result.error,
      });
    }
  };

  const handleExportJson = () => {
    if (!storyResult?.data) return;

    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(storyResult.data, null, 2)
    )}`;
    const link = document.createElement("a");
    link.href = jsonString;
    const topicSlug = storyResult.data.topic.toLowerCase().replace(/\s+/g, '-').slice(0, 20);
    link.download = `hellenika-komiks-${topicSlug}.json`;

    link.click();
    toast({
        title: 'Story Exported',
        description: 'Your story has been downloaded as a JSON file.',
    });
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
          Use the form to generate a new illustrated story, or select a saved one.
        </p>
      </Card>
    );
  }

  const { sentences, illustrations, glosses, topic, level, grammar_scope } = storyResult.data;

  return (
    <div className="space-y-8">
      <div className="no-print flex justify-end gap-2 flex-wrap">
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <Info className="mr-2 h-4 w-4" />
                    Story Info
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="font-headline text-2xl">Story Information</DialogTitle>
                    <DialogDescription>
                        Details about the generated story.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4 text-sm">
                    <div className="grid grid-cols-3 items-center gap-4">
                        <span className="font-semibold text-muted-foreground text-right">Topic</span>
                        <span className="col-span-2">{topic}</span>
                    </div>
                    <div className="grid grid-cols-3 items-center gap-4">
                        <span className="font-semibold text-muted-foreground text-right">Level</span>
                        <span className="col-span-2">{level}</span>
                    </div>
                    <div className="grid grid-cols-3 items-center gap-4">
                        <span className="font-semibold text-muted-foreground text-right">Grammar</span>
                        <span className="col-span-2">{grammar_scope}</span>
                    </div>
                </div>
            </DialogContent>
        </Dialog>

        <Button variant="outline" onClick={handleExportJson}>
          <FileJson className="mr-2 h-4 w-4" />
          Export JSON
        </Button>
        <Button variant="outline" onClick={() => window.print()}>
          <Download className="mr-2 h-4 w-4" />
          Download PDF
        </Button>
        {isSupabaseEnabled && (
          <Button onClick={handleSaveStory} disabled={isSaving || isLoading} className="bg-accent text-accent-foreground hover:bg-accent/90">
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {isSaving ? 'Saving...' : 'Save Story'}
          </Button>
        )}
      </div>
      <div ref={storyContentRef} className="print-container space-y-16">
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
                    <WordGloss key={i} word={word} glosses={glosses} />
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
