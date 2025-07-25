'use client';

import React, { useRef, useState, useMemo } from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, BookOpen, Save, Loader2, Download, FileJson, Info, RefreshCcw, MessageSquareQuote, Image as ImageIcon, WholeWord } from 'lucide-react';
import type { StoryResult, GlossStoryOutput, Sentence, Word } from '@/app/actions';
import { WordGloss } from './word-gloss';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { saveStoryAction, regenerateGlossesAction } from '@/app/actions';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';


interface StoryDisplayProps {
  storyResult: StoryResult | null;
  isLoading: boolean;
  onStorySaved: () => void;
  currentStoryId: number | null;
  onGlossesRegenerated: (newGlosses: GlossStoryOutput) => void;
}

// Supabase is checked in the action, but we can disable the button here too
const isSupabaseEnabled = !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;


export function StoryDisplay({ storyResult, isLoading, onStorySaved, currentStoryId, onGlossesRegenerated }: StoryDisplayProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [showImages, setShowImages] = useState(true);
  const [showSyntax, setShowSyntax] = useState(false);
  const { toast } = useToast();
  const storyContentRef = useRef<HTMLDivElement>(null);

  const needsMorphologyUpdate = useMemo(() => {
    if (!storyResult?.data?.glosses || Object.keys(storyResult.data.glosses).length === 0) {
      return false;
    }
    // Check the first gloss entry for the morphology field.
    const firstGloss = Object.values(storyResult.data.glosses)[0];
    return firstGloss && typeof firstGloss.morphology === 'undefined';
  }, [storyResult]);

  const handleRegenerateGlosses = async () => {
    if (!storyResult?.data?.sentences) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Cannot regenerate glosses without story data.',
        });
        return;
    }

    setIsRegenerating(true);
    // Pass the sentences and the ID (which can be null) to the action.
    const result = await regenerateGlossesAction(storyResult.data.sentences, currentStoryId);
    setIsRegenerating(false);

    if (result.data) {
        toast({
            title: 'Glosses Updated',
            description: 'Morphological data has been added to your story.',
        });
        onGlossesRegenerated(result.data);
    } else {
        toast({
            variant: 'destructive',
            title: 'Update Failed',
            description: result.error || 'An unknown error occurred.',
        });
    }
  };


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
    const topicSlug = storyResult.data.topic.toLowerCase().replace(/\s+/g, '-').slice(0, 50);
    link.download = `${topicSlug}-hellenika-komiks.json`;

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
       {needsMorphologyUpdate && (
        <Card className="p-4 bg-blue-50 border-blue-200">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex-shrink-0">
                    <Info className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-grow">
                    <h4 className="font-semibold text-blue-800">Update Available</h4>
                    <p className="text-sm text-blue-700">
                        This story is missing the new morphological data. Update it to get the latest grammatical insights.
                    </p>
                </div>
                <Button 
                    size="sm" 
                    onClick={handleRegenerateGlosses} 
                    disabled={isRegenerating}
                    className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
                >
                    {isRegenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
                    {isRegenerating ? 'Updating...' : 'Update Glosses'}
                </Button>
            </div>
        </Card>
      )}

      <div className="no-print flex justify-end gap-2 flex-wrap items-center">
        <div className="flex items-center space-x-4 mr-auto">
          <div className="flex items-center space-x-2">
            <Switch
              id="show-images"
              checked={showImages}
              onCheckedChange={setShowImages}
            />
            <Label htmlFor="show-images" className="flex items-center gap-2 text-sm">
              <ImageIcon className="h-4 w-4" />
              Show Illustrations
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="show-syntax"
              checked={showSyntax}
              onCheckedChange={setShowSyntax}
            />
            <Label htmlFor="show-syntax" className="flex items-center gap-2 text-sm">
              <WholeWord className="h-4 w-4" />
              Show Syntax Analysis
            </Label>
          </div>
        </div>

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
          <Button onClick={handleSaveStory} disabled={isSaving || isLoading || !!currentStoryId} className="bg-accent text-accent-foreground hover:bg-accent/90">
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
        {sentences.map((sentenceObj, index) => {
          const illustration = illustrations?.[index];
          const isImageRight = index % 2 === 0;

          return (
            <div
              key={index}
              className="story-item flex flex-col gap-8"
            >
              <div className="flex flex-col md:flex-row gap-8 items-center">
                {showImages && illustration && (
                  <div
                    className={cn(
                      'w-full md:w-1/2',
                      isImageRight ? 'md:order-2' : 'md:order-1'
                    )}
                  >
                    <Image
                      src={illustration}
                      alt={`Illustration for: ${sentenceObj.sentence}`}
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
                    'w-full flex flex-col',
                    showImages && illustration && 'md:w-1/2',
                    isImageRight && showImages && illustration ? 'md:order-1' : 'md:order-2'
                  )}
                >
                  <p className="text-xl lg:text-2xl leading-relaxed lg:leading-loose lang-grc font-body">
                    {sentenceObj.words.map((wordObj, i) => (
                      <WordGloss key={i} wordObj={wordObj} glosses={glosses} />
                    ))}
                  </p>
                  
                  {showSyntax && sentenceObj.detailedSyntax && (
                    <div className="mt-4 text-right">
                       <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground">
                                <MessageSquareQuote className="h-4 w-4" />
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
                            <DialogHeader>
                                <DialogTitle className="font-headline text-2xl">Sentence Analysis</DialogTitle>
                                <DialogDescription className="font-body text-lg">
                                  {sentenceObj.sentence}
                                </DialogDescription>
                            </DialogHeader>
                            <div className="flex-1 overflow-hidden">
                               <ScrollArea className="h-full pr-6">
                                    <div className="space-y-4">
                                      <div>
                                          <h4 className="font-semibold text-primary">Translation</h4>
                                          <p className="text-base italic">
                                              {sentenceObj.detailedSyntax.translation}
                                          </p>
                                      </div>
                                      <Separator />
                                      <div>
                                          <h4 className="font-semibold text-primary">Syntax & Semantic Breakdown</h4>
                                          <div 
                                              className="prose prose-sm max-w-none whitespace-pre-wrap"
                                              dangerouslySetInnerHTML={{ __html: sentenceObj.detailedSyntax.breakdown.replace(/\n/g, '<br />') }}
                                          >
                                          </div>
                                      </div>
                                    </div>
                               </ScrollArea>
                            </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  )}

                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
