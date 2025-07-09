'use client';

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface WordGlossProps {
  word: string;
}

export function WordGloss({ word }: WordGlossProps) {
  if (!word) {
    return null;
  }
  
  // This is a simple way to separate punctuation from the word for the trigger styling.
  const match = word.match(/^([.,·;]?)(.*?)([.,·;]?)$/);
  const leadingPunct = match?.[1] || '';
  const mainWord = match?.[2] || word;
  const trailingPunct = match?.[3] || '';

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
          <p>
            <span className="font-semibold">Gloss for "{mainWord}"</span>
            <br />
            (Feature coming soon)
          </p>
        </PopoverContent>
      </Popover>
      {trailingPunct}{' '}
    </>
  );
}
