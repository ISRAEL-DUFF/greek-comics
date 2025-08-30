
'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import type { BookData } from '../actions';
import { ImagePlus, X, BadgeHelp, WholeWord} from 'lucide-react';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { Library } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { WordLookupPanel } from './word-lookup-panel';
import { LookupState } from '@/hooks/use-word-lookup';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface FullscreenBookViewerProps {
  bookData: BookData;
  onExitFullscreen: () => void;
  showImages: boolean;
  showTranslation: boolean;
  onOpenPanel: () => void;
  onAddWordToPanel: (word: string) => void;
  pendingWordCount: number;
  lookupState: LookupState;
  removeWord: (word: string) => void;
}

function WordClickPopover({ word, onAddWord }: { word: string, onAddWord: (word: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const handleAdd = () => {
    onAddWord(word);
    toast({
      title: 'Word Added to Panel',
      description: `"${word}" has been added to the lookup panel.`,
    });
    setIsOpen(false);
  };

  if (!word.trim()) {
      return <span>{word}</span>;
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <span className="cursor-pointer rounded-md px-1 transition-colors hover:bg-primary/20 focus:bg-primary/30 focus:outline-none">
          {word}
        </span>
      </PopoverTrigger>
      <PopoverContent className="w-auto max-w-sm p-3 text-sm" side="top" align="center">
        <div className="space-y-2 text-center">
            <p className="font-semibold text-base">Add this word to the lookup panel?</p>
            <p className="text-xs text-muted-foreground">The panel will automatically expand it for you.</p>
            <Button size="sm" className="w-full" onClick={handleAdd}>
                <Library className="mr-2 h-4 w-4" />
                Add &quot;{word}&quot;
            </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function FullscreenBookViewer({ 
    bookData, 
    onExitFullscreen, 
    showImages, 
    showTranslation,
    onAddWordToPanel,
    pendingWordCount,
    onOpenPanel,
    lookupState,
    removeWord
}: FullscreenBookViewerProps) {
  const { title, author, pages, coverIllustrationUri } = bookData;
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isWordClick, setIsWordClick] = useState<boolean>(false);

  useEffect(() => {
       // eslint-disable-next-line no-console
    console.debug('Fullscreen lookupState changed', lookupState);
  }, [lookupState]);

  const renderParagraphText = (p: {text: string, translation: string}, isClickable: boolean) => {
      if(isClickable) {
        return (
              <>
              {
                p.text.split('.').map((s, sIndex, arr) => {
                  const words = s.trim().split(/\s+/).filter(Boolean);
                  return (
                    <React.Fragment key={sIndex}>
                      {words.map((w, wIndex) => (
                        <button key={`${sIndex}-${wIndex}`} className="inline bg-transparent p-0 cursor-pointer">
                          <WordClickPopover word={w} onAddWord={() => onAddWordToPanel(w.replace(/[.,·;]/g, ''))} />
                          {wIndex < words.length - 1 ? ' ' : ''}
                        </button>
                      ))}
                      {sIndex < arr.length - 1 ? '. ' : ''}
                    </React.Fragment>
                  );
                })
              }
              </>
            )
      } else {
        return p.text
      }
    }

  return ( 
    <div className="fixed inset-0 bg-background text-foreground z-50 flex flex-col">
        <WordLookupPanel 
        isOpen={isPanelOpen}
        onOpenChange={setIsPanelOpen}
        lookupState={lookupState}
        removeWord={removeWord}
        // dialogClassName="z-60"
      />
      <header className="flex items-center justify-between p-4 border-b border-primary border-2">
        <div className="text-lg font-headline">{title}</div>
        <Button variant="outline" className="relative" onClick={() => setIsPanelOpen(true)}>
            <Library className="mr-2 h-4 w-4" />
            {pendingWordCount > 0 && (
            <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center">
                {pendingWordCount}
            </Badge>
            )}
        </Button>
        <Switch id="show-syntax" checked={isWordClick} onCheckedChange={setIsWordClick} />
        <Button variant="ghost" size="icon" onClick={onExitFullscreen}>
          <X className="h-6 w-6" />
          <span className="sr-only">Exit Fullscreen</span>
        </Button>
      </header>
      <main className="flex-1 overflow-auto p-4 md:p-8 h-full">
        <Carousel className="w-full h-full" opts={{ loop: false, align: "center" }}>
            <CarouselContent className=" h-[80vh]">
                {/* Cover Page */}
                <CarouselItem className="flex items-center justify-center h-[80vh]">
                    <Card className="bg-background text-foreground border-primary border-2 text-white max-w-lg w-full">
                        <CardContent className="p-4 md:p-6 flex flex-col items-center text-center gap-4">
                            <h1 className="text-3xl md:text-4xl font-headline font-bold text-primary">{title}</h1>
                            <p className="text-lg text-gray-400">by {author}</p>
                            <div className="w-full max-w-md aspect-[3/4] relative mt-4 lg:h-[50vh]">
                                <Image
                                    src={coverIllustrationUri}
                                    alt={`Cover for: ${title}`}
                                    layout="fill"
                                    className="rounded-lg object-cover shadow-lg"
                                    unoptimized
                                />
                            </div>
                        </CardContent>
                    </Card>
                </CarouselItem>

                {/* Content Pages */}
                 {pages.map((page, pageIndex) => (
                    <CarouselItem key={pageIndex} className="flex items-center justify-center  h-[80vh]">
                         <Card className="bg-background text-foreground border-primary border-2 max-w-4xl w-full h-full overflow-y-auto">
                            <CardContent className="p-6 md:p-8">
                                <div className="flex-grow space-y-8">
                                    {page.title && <h2 className="text-2xl font-bold font-headline text-primary mb-6 text-center">{page.title}</h2>}
                                    
                                    {showImages && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
                                            {page.mainIllustrations.map((illustration, imgIndex) => (
                                                <div key={imgIndex} className="aspect-video w-full relative bg-muted rounded-md flex items-center justify-center">
                                                    {illustration.illustrationUri ? (
                                                        <Image
                                                            src={illustration.illustrationUri}
                                                            alt={illustration.prompt}
                                                            layout="fill"
                                                            className="rounded-md object-cover"
                                                            unoptimized
                                                        />
                                                    ) : (
                                                        <button className="w-full h-full flex items-center justify-center bg-muted rounded-md hover:bg-muted/80 transition-colors">
                                                            <ImagePlus className="h-8 w-8 text-muted-foreground" />
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <div className="space-y-6">
                                        {page.paragraphs.map((p, pIndex) => (
                                        <div key={pIndex} className="mb-6 last:mb-0">
                                              <p className="text-lg lg:text-xl leading-relaxed font-body lang-grc">
                                                    {renderParagraphText(p, isWordClick)}
                                                </p>
                                              {showTranslation && <p className="text-base italic text-muted-foreground mt-2">{p.translation}</p>}
                                        </div>
                                        ))}
                                    </div>
                                </div>
                                
                                {page.footnotes && page.footnotes.length > 0 && (
                                    <div className="mt-8 pt-6 border-t-2 border-dashed">
                                        <h4 className="font-headline text-lg font-semibold mb-4 text-center text-muted-foreground">Λεξικὸν (Glossary)</h4>
                                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-4 text-sm">
                                            {page.footnotes.map((note, noteIndex) => (
                                                <div key={noteIndex} className="flex items-start gap-3">
                                                    <div className="w-10 h-10 relative flex-shrink-0 mt-1">
                                                        {note.illustrationUri ? (
                                                            <Image 
                                                                src={note.illustrationUri} 
                                                                alt={note.word} 
                                                                layout="fill" 
                                                                className="rounded-md object-contain"
                                                                unoptimized
                                                            />
                                                        ) : (
                                                            <button className="w-full h-full flex items-center justify-center bg-muted rounded-md hover:bg-muted/80 transition-colors">
                                                                <ImagePlus className="h-5 w-5 text-muted-foreground" />
                                                            </button>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold lang-grc">{note.word}</p>
                                                        <p className="text-muted-foreground lang-grc">{note.definition}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                
                                <div className="text-center text-sm text-muted-foreground pt-8 mt-auto">
                                    <p>Page {page.pageNumber}</p>
                                </div>
                            </CardContent>
                        </Card>
                    </CarouselItem>
                ))}
            </CarouselContent>
            <CarouselPrevious className="left-4 text-white hover:text-primary hidden md:flex" />
            <CarouselNext className="right-4 text-white hover:text-primary hidden md:flex" />
        </Carousel>
      </main>
    </div>
  );
}
