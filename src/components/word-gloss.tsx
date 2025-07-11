'use client';

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import type { GlossStoryOutput } from '@/ai/flows/gloss-story-flow';

interface WordGlossProps {
  word: string;
  glosses: GlossStoryOutput;
}

export function WordGloss({ word, glosses }: WordGlossProps) {
  if (!word) {
    return null;
  }
  
  const match = word.match(/^([.,·;]?)(.*?)([.,·;]?)$/);
  const leadingPunct = match?.[1] || '';
  const mainWord = match?.[2] || word;
  const trailingPunct = match?.[3] || '';

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
        <PopoverContent className="w-auto max-w-xs p-3 text-sm" side="top" align="center">
          <div className="space-y-1">
            <p className="font-bold">{glossData.lemma}</p>
            <p className="text-xs italic text-muted-foreground">{glossData.partOfSpeech}</p>
            <p>{glossData.definition}</p>
          </div>
        </PopoverContent>
      </Popover>
      {trailingPunct}{' '}
    </>
  );
}
