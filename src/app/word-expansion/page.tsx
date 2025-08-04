'use client';

import { useState, useEffect, useTransition } from 'react';
import {
  getExpandedWordsAction,
  getExpandedWordByIdAction,
  generateAndSaveWordExpansionAction,
  type ExpandedWordListItem,
  type ExpandedWord,
} from './actions';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Sparkles, Wand2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { MarkdownDisplay } from '@/components/markdown-display';
import { Skeleton } from '@/components/ui/skeleton';

export default function WordExpansionPage() {
  const [word, setWord] = useState('');
  const [isPending, startTransition] = useTransition();
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  
  const [expandedWords, setExpandedWords] = useState<ExpandedWordListItem[]>([]);
  const [currentWord, setCurrentWord] = useState<ExpandedWord | null>(null);
  
  const { toast } = useToast();

  const fetchExpandedWords = async () => {
    setIsLoadingList(true);
    const words = await getExpandedWordsAction();
    setExpandedWords(words);
    setIsLoadingList(false);
  };

  useEffect(() => {
    fetchExpandedWords();
  }, []);

  const handleSelectWord = async (item: ExpandedWordListItem) => {
    setIsLoadingContent(true);
    setCurrentWord(null);
    const fullWord = await getExpandedWordByIdAction(item.id);
    setCurrentWord(fullWord);
    setIsLoadingContent(false);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!word.trim()) return;

    startTransition(async () => {
      setCurrentWord(null);
      setIsLoadingContent(true);
      const result = await generateAndSaveWordExpansionAction(word);
      setIsLoadingContent(false);

      if (result.error) {
        toast({
          variant: 'destructive',
          title: 'Expansion Failed',
          description: result.error,
        });
        setCurrentWord(null);
      } else {
        toast({
          title: 'Expansion Complete',
          description: `Successfully generated details for "${result.data?.word}".`,
        });
        setCurrentWord(result.data!);
        setWord('');
        // Refresh the list
        fetchExpandedWords();
      }
    });
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b bg-background/80 py-4 backdrop-blur-sm">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-headline text-4xl font-bold text-primary">Word Expansion Tool</h1>
          <p className="mt-1 text-lg text-muted-foreground">Detailed Greek Word Analysis</p>
          <div className="absolute top-4 left-4">
             <Link href="/" className="text-sm text-muted-foreground hover:text-primary underline">
                &larr; Back to Story Generator
            </Link>
          </div>
        </div>
      </header>
      <main className="container mx-auto flex-1 px-4 py-8">
        <div className="grid gap-12 lg:grid-cols-12">
          <aside className="lg:col-span-4 xl:col-span-3">
            <div className="sticky top-24 space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>Expand a Word</CardTitle>
                  <CardDescription>Enter a Greek word to analyze.</CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                  <CardContent>
                    <Input
                      placeholder="e.g., λόγος"
                      value={word}
                      onChange={(e) => setWord(e.target.value)}
                      disabled={isPending}
                      className="font-body text-lg"
                    />
                  </CardContent>
                  <CardFooter>
                    <Button type="submit" disabled={isPending || !word.trim()} className="w-full">
                      {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                      {isPending ? 'Generating...' : 'Generate'}
                    </Button>
                  </CardFooter>
                </form>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>History</CardTitle>
                  <CardDescription>Previously expanded words.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-96">
                        {isLoadingList ? (
                            <div className="space-y-2 pr-4">
                                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                            </div>
                        ) : expandedWords.length > 0 ? (
                            <div className="space-y-2 pr-4">
                                {expandedWords.map((item) => (
                                <Button
                                    key={item.id}
                                    variant={currentWord?.id === item.id ? 'secondary' : 'ghost'}
                                    className={cn(
                                        'w-full justify-start h-auto py-2 px-3 text-left font-body text-base',
                                        currentWord?.id === item.id && 'bg-accent/20'
                                    )}
                                    onClick={() => handleSelectWord(item)}
                                >
                                    {item.word}
                                </Button>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center text-muted-foreground p-4 text-sm">
                                No words expanded yet.
                            </div>
                        )}
                    </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </aside>
          <div className="lg:col-span-8 xl:col-span-9">
            <Card className="min-h-[60vh]">
                <CardContent className="p-2 md:p-6 h-full">
                    {isLoadingContent || isPending ? (
                        <div className="space-y-4 pt-6">
                            <Skeleton className="h-8 w-1/4" />
                            <Skeleton className="h-4 w-1/3" />
                            <div className="space-y-2 pt-4">
                                <Skeleton className="h-6 w-full" />
                                <Skeleton className="h-6 w-5/6" />
                                <Skeleton className="h-6 w-full" />
                            </div>
                        </div>
                    ) : currentWord ? (
                        <MarkdownDisplay markdown={currentWord.expansion} />
                    ) : (
                        <div className="flex flex-col items-center justify-center p-8 text-center h-full">
                            <Wand2 className="h-16 w-16 text-muted-foreground/50" />
                            <h3 className="mt-4 text-xl font-semibold font-headline">
                                Analysis will appear here
                            </h3>
                            <p className="mt-2 text-muted-foreground">
                                Enter a word to begin, or select one from your history.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
