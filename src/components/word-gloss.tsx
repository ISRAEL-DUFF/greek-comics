'use client';

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import type { GlossStoryOutput, Word } from '@/app/actions';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { MessageSquareQuote } from 'lucide-react';

interface WordGlossProps {
  wordObj: Word;
  glosses: GlossStoryOutput;
}

export function WordGloss({ wordObj, glosses }: WordGlossProps) {
  const { word, syntaxNote } = wordObj;
  
  if (!word) {
    return null;
  }
  
  const match = word.match(/^([.,·;]?)(.*?)([.,·;]?)$/);
  const leadingPunct = match?.[1] || '';
  const mainWord = match?.[2] || word;
  const trailingPunct = match?.[3] || '';

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
          <div className="space-y-2">
            <p className="font-bold text-base">{glossData.lemma}</p>
            <p className="text-xs italic text-muted-foreground">{glossData.partOfSpeech}</p>
            {glossData.morphology && (
              <Badge variant="outline" className="text-xs font-mono">{glossData.morphology}</Badge>
            )}
            <p className="pt-1">{glossData.definition}</p>

            {syntaxNote && syntaxNote !== 'N/A' && (
                <>
                    <Separator className="my-2" />
                    <div className="flex items-start gap-2 text-xs">
                        <MessageSquareQuote className="h-4 w-4 flex-shrink-0 text-muted-foreground mt-0.5" />
                        <p className="text-muted-foreground">{syntaxNote}</p>
                    </div>
                </>
            )}
          </div>
        </PopoverContent>
      </Popover>
      {trailingPunct}{' '}
    </>
  );
}
