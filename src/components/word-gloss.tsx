'use client';

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import type { GlossStoryOutput } from '@/app/actions';
import { Badge } from './ui/badge';

interface WordGlossProps {
  word: string;
  glosses: GlossStoryOutput;
}

export function WordGloss({ word, glosses }: WordGlossProps) {
  if (!word) {
    return null;
  }
  
  // This regex handles leading/trailing punctuation, including Greek-specific ones.
  const match = word.match(/^([.,·;]?)(.*?)([.,·;]?)$/);
  const leadingPunct = match?.[1] || '';
  const mainWord = match?.[2] || word;
  const trailingPunct = match?.[3] || '';

  // If the "word" is only punctuation, just render it.
  if (!mainWord) {
    return <>{word}{' '}</>;
  }

  const normalizedWord = mainWord.toLowerCase();
  const glossData = glosses[normalizedWord];

  if (!glossData) {
    return <>{word}{' '}</>;
  }

  return (
    <>
      {leadingPunct}
      <Popover>
        <PopoverTrigger asChild>
          <span className="cursor-pointer rounded-md px-1 transition-colors hover:bg-primary/20 focus:bg-primary/30 focus:outline-none">
            {mainWord}
          </span>
        </PopoverTrigger>
        <PopoverContent className="w-auto max-w-sm p-3 text-sm" side="top" align="center">
          <div className="space-y-1.5">
            <p className="font-bold text-base">{glossData.lemma}</p>
            <p className="text-xs italic text-muted-foreground">{glossData.partOfSpeech}</p>
            {glossData.morphology && (
              <Badge variant="outline" className="text-xs font-mono">{glossData.morphology}</Badge>
            )}
            <p className="pt-1">{glossData.definition}</p>
          </div>
        </PopoverContent>
      </Popover>
      {trailingPunct}{' '}
    </>
  );
}
