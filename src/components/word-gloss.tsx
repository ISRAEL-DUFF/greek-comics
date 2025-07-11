'use client';

import { useState } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { getWordGlossAction, type GlossResult } from '@/app/actions';
import { Loader2 } from 'lucide-react';
import { Skeleton } from './ui/skeleton';

interface WordGlossProps {
  word: string;
}

export function WordGloss({ word }: WordGlossProps) {
  const [gloss, setGloss] = useState<GlossResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  if (!word) {
    return null;
  }
  
  const match = word.match(/^([.,·;]?)(.*?)([.,·;]?)$/);
  const leadingPunct = match?.[1] || '';
  const mainWord = match?.[2] || word;
  const trailingPunct = match?.[3] || '';

  const handleOpenChange = async (open: boolean) => {
    setIsOpen(open);
    if (open && !gloss) {
      setIsLoading(true);
      const result = await getWordGlossAction(mainWord);
      setGloss(result);
      setIsLoading(false);
    }
  };

  return (
    <>
      {leadingPunct}
      <Popover open={isOpen} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <span className="cursor-pointer rounded-md px-1 transition-colors hover:bg-primary/20 focus:bg-primary/30 focus:outline-none">
            {mainWord}
          </span>
        </PopoverTrigger>
        <PopoverContent className="w-auto max-w-xs p-3 text-sm" side="top" align="center">
          {isLoading && (
            <div className="space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-full" />
            </div>
          )}
          {gloss?.error && (
            <p className="text-destructive-foreground/80">{gloss.error}</p>
          )}
          {gloss?.data && (
            <div className="space-y-1">
              <p className="font-bold">{gloss.data.lemma}</p>
              <p className="text-xs italic text-muted-foreground">{gloss.data.partOfSpeech}</p>
              <p>{gloss.data.definition}</p>
            </div>
          )}
        </PopoverContent>
      </Popover>
      {trailingPunct}{' '}
    </>
  );
}
