
'use client';

import { useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { BookMarked, Upload } from "lucide-react";
import type { BookData } from '../actions';
import { z } from 'zod';
import { DetailedSyntaxSchema } from '@/lib/schemas';


interface SavedBooksListProps {
  onBookImported: (storyData: BookData | null) => void;
  onImportStarted: () => void;
}

const PageIllustrationSchema = z.object({
    prompt: z.string(),
    illustrationUri: z.string().optional(),
});

const FootnoteSchema = z.object({
    word: z.string(),
    definition: z.string(),
    illustrationPrompt: z.string(),
    illustrationUri: z.string().optional(),
});


const WordSchema = z.object({
  word: z.string(),
  syntaxNote: z.string(),
});

const SentenceSchema = z.object({
  sentence: z.string(),
  words: z.array(WordSchema),
  detailedSyntax: DetailedSyntaxSchema,
});

const ParagraphSchema = z.object({
    sentences: z.array(SentenceSchema),
});

const PageSchema = z.object({
    pageNumber: z.number(),
    title: z.string().optional(),
    paragraphs: z.array(ParagraphSchema),
    mainIllustrations: z.array(PageIllustrationSchema).optional().default([]),
    footnotes: z.array(FootnoteSchema),
});


// This schema is for validating imported JSON files.
const BookDataSchema = z.object({
    title: z.string(),
    author: z.string(),
    pages: z.array(PageSchema),
    coverIllustrationUri: z.string(),
    topic: z.string(),
    level: z.string(),
    grammarScope: z.string(),
});


type ImportResult = {
  data?: BookData;
  error?: string;
};


export function SavedBooksList({ onBookImported, onImportStarted }: SavedBooksListProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  async function importBookFrontend(fileContent: string): Promise<ImportResult> {
    try {
      const json = JSON.parse(fileContent);
      const validatedData = BookDataSchema.safeParse(json);
  
      if (!validatedData.success) {
        console.error("Zod validation error:", validatedData.error.flatten());
        return { error: `Invalid JSON format. ${validatedData.error.flatten().formErrors.join(', ')}` };
      }
  
      return { data: validatedData.data as BookData };
  
    } catch (error) {
      if (error instanceof SyntaxError) {
        return { error: "Invalid JSON file. Could not parse the file content." };
      }
      console.error("Error importing book:", error);
      return { error: "An unexpected error occurred while importing the book." };
    }
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    onImportStarted();

    const fileContent = await file.text();
    const result = await importBookFrontend(fileContent);

    if (result.error) {
      toast({
        variant: 'destructive',
        title: 'Import Failed',
        description: result.error,
      });
      onBookImported(null);
    } else if (result.data) {
      toast({
        title: 'Book Imported',
        description: `Successfully loaded "${result.data.title}".`,
      });
      onBookImported(result.data);
    }
    
    // Reset file input to allow importing the same file again
    if(fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  return (
    <Card className="shadow-lg border-0 md:border md:shadow-lg">
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <CardTitle className="font-headline text-2xl flex items-center gap-2">
                <BookMarked />
                Saved Books
                </CardTitle>
                <CardDescription>Select a book to view it again.</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={handleImportClick}>
                <Upload className="mr-2 h-4 w-4" />
                Import
            </Button>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".json"
                className="hidden"
            />
        </div>
      </CardHeader>
      <CardContent>
          <ScrollArea className="h-48">
              <div className="text-center text-muted-foreground p-4 text-sm">
                <p>Saving books to the cloud is not yet implemented.</p>
                <p className="text-xs">Use the import/export feature for now.</p>
              </div>
          </ScrollArea>
      </CardContent>
    </Card>
  );
}
