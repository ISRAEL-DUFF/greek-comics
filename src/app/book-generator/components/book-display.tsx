
'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, BookOpen, Download, FileJson, ImagePlus, Image as ImageIcon, Languages, Maximize, MessageSquareQuote, WholeWord, Library, BadgeHelp, ClipboardCheck } from 'lucide-react';
import type { BookResult } from '../actions';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { FootnoteImageModal } from './footnote-image-modal';
import type { BookData } from '../actions';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';


interface BookDisplayProps {
  bookResult: BookResult | null;
  isLoading: boolean;
  onEnterFullscreen: () => void;
  showImages: boolean;
  setShowImages: (value: boolean) => void;
  showTranslation: boolean;
  setShowTranslation: (value: boolean) => void;
  showSyntax: boolean;
  setShowSyntax: (value: boolean) => void;
  onAddWordToPanel: (word: string) => void;
  onOpenPanel: () => void;
  pendingWordCount: number;
}

type ModalState = {
    isOpen: boolean;
    pageIndex: number;
    imageType: 'footnote' | 'main';
    imageIndex: number;
    prompt: string;
    isMainIllustration?: boolean;
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


export function BookDisplay({ 
    bookResult, 
    isLoading, 
    onEnterFullscreen,
    showImages,
    setShowImages,
    showTranslation,
    setShowTranslation,
    showSyntax,
    setShowSyntax,
    onAddWordToPanel,
    onOpenPanel,
    pendingWordCount,
}: BookDisplayProps) {
  const { toast } = useToast();
  const [currentBook, setCurrentBook] = useState<BookData | null>(bookResult?.data || null);
  
  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
    pageIndex: -1,
    imageType: 'footnote',
    imageIndex: -1,
    prompt: '',
  });

  // Keep the display in sync if the prop changes
  React.useEffect(() => {
    setCurrentBook(bookResult?.data || null);
  }, [bookResult]);

  const handleExportJson = () => {
    if (!currentBook) return;

    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(currentBook, null, 2)
    )}`;
    const link = document.createElement("a");
    link.href = jsonString;
    const topicSlug = currentBook.topic.toLowerCase().replace(/\s+/g, '-').slice(0, 50);
    link.download = `${topicSlug}-hellenika-book.json`;

    link.click();
    toast({
        title: 'Book Exported',
        description: 'Your book has been downloaded as a JSON file.',
    });
  };

  const openModal = (pageIndex: number, imageIndex: number, prompt: string, imageType: 'main' | 'footnote') => {
    setModalState({ isOpen: true, pageIndex, imageIndex, prompt, imageType });
  };

  const handleImageSave = (imageUri: string) => {
    if (!currentBook || modalState.pageIndex === -1 || modalState.imageIndex === -1) return;

    // Create a deep copy of the book data to avoid direct state mutation
    const updatedBook = JSON.parse(JSON.stringify(currentBook));
    
    if (modalState.imageType === 'main') {
        updatedBook.pages[modalState.pageIndex].mainIllustrations[modalState.imageIndex].illustrationUri = imageUri;
    } else {
        updatedBook.pages[modalState.pageIndex].footnotes[modalState.imageIndex].illustrationUri = imageUri;
    }

    // Update the state with the modified book data
    setCurrentBook(updatedBook);

    toast({
        title: 'Illustration Updated',
        description: 'The illustration has been updated.',
    });

    // Close the modal
    setModalState({ isOpen: false, pageIndex: -1, imageIndex: -1, prompt: '', imageType: 'footnote' });
  };


  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex flex-col md:flex-row gap-8 items-center">
            <div className="w-full md:w-1/3">
                <Skeleton className="w-full aspect-[3/4] rounded-lg" />
            </div>
            <div className="w-full md:w-2/3 space-y-4">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-5 w-1/2" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-5/6" />
            </div>
        </div>
      </Card>
    );
  }

  if (bookResult?.error) {
    return (
      <Card className="flex flex-col items-center justify-center p-8 text-center">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <h3 className="mt-4 text-xl font-semibold">Generation Failed</h3>
        <p className="mt-2 text-muted-foreground">{bookResult.error}</p>
      </Card>
    );
  }

  if (!currentBook) {
    return (
      <Card className="flex flex-col items-center justify-center p-8 text-center border-dashed min-h-[60vh]">
        <BookOpen className="h-16 w-16 text-muted-foreground/50" />
        <h3 className="mt-4 text-xl font-semibold font-headline">
          Your Book Awaits
        </h3>
        <p className="mt-2 text-muted-foreground">
          Use the form to generate a new illustrated book.
        </p>
      </Card>
    );
  }

  const { title, author, pages, coverIllustrationUri, level, topic, grammarScope } = currentBook;

  return (
    <>
      <FootnoteImageModal 
        isOpen={modalState.isOpen}
        onOpenChange={(isOpen) => setModalState(prev => ({...prev, isOpen}))}
        prompt={modalState.prompt}
        onSave={handleImageSave}
        isMainIllustration={modalState.imageType === 'main'}
      />
      <div className="space-y-8">
          <div className="no-print flex justify-end gap-4 flex-wrap items-center">
                <div className="flex items-center space-x-2 mr-auto flex-wrap gap-y-2">
                    <div className="flex items-center space-x-2">
                        <Switch id="show-images" checked={showImages} onCheckedChange={setShowImages} />
                        <Label htmlFor="show-images" className="flex items-center gap-2 text-sm"><ImageIcon className="h-4 w-4" />Illustrations</Label>
                    </div>
                     <div className="flex items-center space-x-2">
                        <Switch id="show-translation" checked={showTranslation} onCheckedChange={setShowTranslation} />
                        <Label htmlFor="show-translation" className="flex items-center gap-2 text-sm"><Languages className="h-4 w-4" />Translation</Label>
                    </div>
                     <div className="flex items-center space-x-2">
                        <Switch id="show-syntax" checked={showSyntax} onCheckedChange={setShowSyntax} />
                        <Label htmlFor="show-syntax" className="flex items-center gap-2 text-sm"><WholeWord className="h-4 w-4" />Analysis</Label>
                    </div>
                </div>
              <Button variant="outline" className="relative" onClick={onOpenPanel}>
                  <Library className="mr-2 h-4 w-4" />
                  Lookup Panel
                  {pendingWordCount > 0 && (
                    <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center">
                      {pendingWordCount}
                    </Badge>
                  )}
              </Button>
              <Button variant="outline" onClick={handleExportJson}>
                  <FileJson className="mr-2 h-4 w-4" />
                  Export
              </Button>
              <Button variant="outline" onClick={() => window.print()}>
                  <Download className="mr-2 h-4 w-4" />
                  PDF
              </Button>
               <Button variant="outline" onClick={onEnterFullscreen}>
                  <Maximize className="mr-2 h-4 w-4" />
                  Fullscreen
              </Button>
          </div>

          <Carousel className="lg:w-full w-[90vw]" opts={{ loop: false }}>
              <CarouselContent>
                  {/* Cover Page */}
                  <CarouselItem>
                      <Card className="p-4 md:p-6 border-primary border-2">
                          <div className="flex flex-col items-center text-center gap-4">
                              <h1 className="text-4xl font-headline font-bold text-primary">{title}</h1>
                              <p className="text-lg text-muted-foreground">by {author}</p>
                              <div className="w-full max-w-md aspect-[3/4] relative mt-4">
                                  <Image
                                      src={coverIllustrationUri}
                                      alt={`Cover for: ${title}`}
                                      layout="fill"
                                      className="rounded-lg object-cover shadow-lg"
                                      unoptimized
                                  />
                              </div>
                              <div className="flex flex-wrap gap-2 mt-4 justify-center">
                                  <Badge variant="secondary">{level}</Badge>
                                  <Badge variant="secondary">{topic}</Badge>
                                  <Badge variant="secondary">{grammarScope}</Badge>
                              </div>
                          </div>
                      </Card>
                  </CarouselItem>
                  {/* Content Pages */}
                  {pages.map((page, pageIndex) => (
                      <CarouselItem key={pageIndex}>
                          <div className="p-1 h-full">
                              <Card className="p-6 md:p-8 h-full flex flex-col justify-between min-h-[80vh]">
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
                                                            <button onClick={() => openModal(pageIndex, imgIndex, illustration.prompt, 'main')} className="w-full h-full flex items-center justify-center bg-muted rounded-md hover:bg-muted/80 transition-colors">
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
                                                {p.text.split('.').map((s, sIndex, arr) => {
                                                  const words = s.trim().split(/\s+/).filter(Boolean);
                                                  return (
                                                    <React.Fragment key={sIndex}>
                                                      {words.map((w, wIndex) => (
                                                        <React.Fragment key={`${sIndex}-${wIndex}`}>
                                                          <WordClickPopover word={w} onAddWord={() => onAddWordToPanel(w.replace(/[.,·;]/g, ''))} />
                                                          {wIndex < words.length - 1 ? ' ' : ''}
                                                        </React.Fragment>
                                                      ))}
                                                      {sIndex < arr.length - 1 ? '. ' : ''}
                                                    </React.Fragment>
                                                  );
                                                })}
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
                                                              <button onClick={() => openModal(pageIndex, noteIndex, note.illustrationPrompt, 'footnote')} className="w-full h-full flex items-center justify-center bg-muted rounded-md hover:bg-muted/80 transition-colors">
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
                              </Card>
                          </div>
                      </CarouselItem>
                  ))}
              </CarouselContent>
              <CarouselPrevious className="ml-12" />
              <CarouselNext className="mr-12" />
          </Carousel>
      </div>
    </>
  );
}
