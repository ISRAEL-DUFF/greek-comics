
'use client';

import React from 'react';
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
import { X } from 'lucide-react';

interface FullscreenBookViewerProps {
  bookData: BookData;
  onExitFullscreen: () => void;
  showImages: boolean;
  showTranslation: boolean;
}

export function FullscreenBookViewer({ 
    bookData, 
    onExitFullscreen, 
    showImages, 
    showTranslation 
}: FullscreenBookViewerProps) {
  const { title, author, pages, coverIllustrationUri } = bookData;

  return (
    <div className="fixed inset-0 bg-gray-900 text-white z-50 flex flex-col">
      <header className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="text-lg font-headline">{title}</div>
        <Button variant="ghost" size="icon" onClick={onExitFullscreen}>
          <X className="h-6 w-6" />
          <span className="sr-only">Exit Fullscreen</span>
        </Button>
      </header>
      <main className="flex-1 overflow-auto p-4 md:p-8">
        <Carousel className="w-full h-full" opts={{ loop: false, align: "center" }}>
            <CarouselContent className="h-full">
                {/* Cover Page */}
                <CarouselItem className="flex items-center justify-center">
                    <Card className="bg-gray-800 border-primary text-white max-w-lg w-full">
                        <CardContent className="p-4 md:p-6 flex flex-col items-center text-center gap-4">
                            <h1 className="text-3xl md:text-4xl font-headline font-bold text-primary">{title}</h1>
                            <p className="text-lg text-gray-400">by {author}</p>
                            <div className="w-full max-w-md aspect-[3/4] relative mt-4">
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
                    <CarouselItem key={pageIndex} className="flex items-center justify-center">
                         <Card className="bg-gray-800 border-gray-700 text-white max-w-4xl w-full h-[90vh] overflow-y-auto">
                            <CardContent className="p-6 md:p-8">
                                <div className="flex-grow space-y-8">
                                    {page.title && <h2 className="text-2xl font-bold font-headline text-primary mb-6 text-center">{page.title}</h2>}
                                    
                                    {showImages && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
                                            {page.mainIllustrations.map((illustration, imgIndex) => (
                                                <div key={imgIndex} className="aspect-video w-full relative bg-gray-700 rounded-md flex items-center justify-center">
                                                    {illustration.illustrationUri && (
                                                        <Image
                                                            src={illustration.illustrationUri}
                                                            alt={illustration.prompt}
                                                            layout="fill"
                                                            className="rounded-md object-cover"
                                                            unoptimized
                                                        />
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <div className="space-y-6">
                                        {page.paragraphs.map((p, pIndex) => (
                                            <div key={pIndex} className="mb-6 last:mb-0">
                                                <p className="text-xl lg:text-2xl leading-relaxed font-body lang-grc">{p.text}</p>
                                                {showTranslation && <p className="text-base italic text-gray-400 mt-2">{p.translation}</p>}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                
                                {page.footnotes && page.footnotes.length > 0 && (
                                    <div className="mt-8 pt-6 border-t-2 border-dashed border-gray-600">
                                        <h4 className="font-headline text-lg font-semibold mb-4 text-center text-gray-400">Λεξικὸν</h4>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4 text-sm">
                                            {page.footnotes.map((note, noteIndex) => (
                                                <div key={noteIndex} className="flex items-start gap-3">
                                                     {note.illustrationUri && (
                                                        <div className="w-12 h-12 relative flex-shrink-0 mt-1 bg-gray-700 rounded-md">
                                                            <Image 
                                                                src={note.illustrationUri} 
                                                                alt={note.word} 
                                                                layout="fill" 
                                                                className="rounded-md object-contain p-1"
                                                                unoptimized
                                                            />
                                                        </div>
                                                     )}
                                                    <div>
                                                        <p className="font-bold lang-grc">{note.word}</p>
                                                        <p className="text-gray-400 lang-grc">{note.definition}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                
                                <div className="text-center text-sm text-gray-500 pt-8 mt-auto">
                                    <p>Page {page.pageNumber}</p>
                                </div>
                            </CardContent>
                        </Card>
                    </CarouselItem>
                ))}
            </CarouselContent>
            <CarouselPrevious className="left-4 text-white hover:text-primary" />
            <CarouselNext className="right-4 text-white hover:text-primary" />
        </Carousel>
      </main>
    </div>
  );
}
