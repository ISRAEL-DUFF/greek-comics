
'use client';

import React, { useState, useEffect, useTransition, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  getExpandedWordsAction,
  getExpandedWordByIdAction,
  generateAndSaveWordExpansionAction,
  updateWordExpansionAction,
  type ExpandedWordListItem,
  type ExpandedWord,
} from './actions';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Sparkles, Wand2, Edit, Save, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { MarkdownDisplay } from '@/components/markdown-display';
import { MarkdownEditor } from '@/components/markdown-editor';
import { Skeleton } from '@/components/ui/skeleton';
import { WordSearchModal } from './components/word-search-modal';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const greekNormalization = {
  normalizeGreek: (lemma: string) =>{
    return lemma
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\p{Script=Greek}]/gu, "")
      .toLowerCase();
  },

  normalizeLemma(lemma: string) {
    return lemma.replace(/\d+$/, '');
  }
}

function WordExpansionContent() {
  const searchParams = useSearchParams();
  const wordFromUrl = searchParams.get('word');

  const [words, setWords] = useState('');
  const [isGenerating, startGeneratingTransition] = useTransition();
  const [isSaving, startSavingTransition] = useTransition();
  
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  
  const [allExpandedWords, setAllExpandedWords] = useState<ExpandedWordListItem[]>([]);
  const [currentWord, setCurrentWord] = useState<ExpandedWord | null>(null);

  const [isEditMode, setIsEditMode] = useState(false);
  const [editedContent, setEditedContent] = useState('');

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  
  const { toast } = useToast();

  const fetchExpandedWords = async () => {
    setIsLoadingList(true);
    const words = await getExpandedWordsAction();
    setAllExpandedWords(words);
    setIsLoadingList(false);
  };
  
  const handleGenerate = async (wordsToExpand: string) => {
    if (!wordsToExpand.trim()) return;

    startGeneratingTransition(async () => {
      setCurrentWord(null);
      setIsEditMode(false);
      setIsLoadingContent(true);
      const result = await generateAndSaveWordExpansionAction(wordsToExpand);
      setIsLoadingContent(false);

      if (result.error) {
        toast({
          variant: 'destructive',
          title: 'Expansion Failed',
          description: result.error,
        });
        setCurrentWord(null);
      } else if (result.data && result.data.length > 0) {
        const lastWord = result.data[result.data.length - 1];
        toast({
          title: 'Expansion Complete',
          description: `Successfully generated details for ${result.data.length} word(s).`,
        });
        // Select and display the last successfully generated word
        setCurrentWord(lastWord); 
        setEditedContent(lastWord.expansion);
        setWords(''); // Clear input on success
        fetchExpandedWords(); // Refresh the history list
      }
    });
  };

  useEffect(() => {
    fetchExpandedWords();
    // If a word is passed in the URL, set it in the input and trigger generation.
    if (wordFromUrl) {
      setWords(wordFromUrl);
      // We wrap this in a timeout to ensure the state has updated before we call handleGenerate.
      setTimeout(() => handleGenerate(wordFromUrl), 0);
    }
  }, [wordFromUrl]);
  
  const groupedAndSortedWords = useMemo(() => {
    if (!allExpandedWords) return {};

    const grouped = allExpandedWords.reduce((acc, wordItem) => {
        if (!wordItem.word) return acc;
        const word = greekNormalization.normalizeGreek(wordItem.word);
        const firstLetter = word.charAt(0).toUpperCase();
        if (!acc[firstLetter]) {
            acc[firstLetter] = [];
        }
        acc[firstLetter].push(wordItem);
        return acc;
    }, {} as Record<string, ExpandedWordListItem[]>);
    
    // Sort words within each group and sort the groups by letter
    Object.keys(grouped).forEach(letter => {
        grouped[letter].sort((a, b) => a.word.localeCompare(b.word));
    });

    return Object.fromEntries(
        Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b))
    );
  }, [allExpandedWords]);

  const handleSelectWord = async (item: ExpandedWordListItem) => {
    setIsLoadingContent(true);
    setIsEditMode(false);
    setCurrentWord(null);
    const fullWord = await getExpandedWordByIdAction(item.id);
    setCurrentWord(fullWord);
    if(fullWord) {
      setEditedContent(fullWord.expansion);
    }
    setIsLoadingContent(false);
  };
  
  const handleSelectWordFromSearch = (item: ExpandedWordListItem) => {
    handleSelectWord(item);
    setIsSearchOpen(false); // Close modal on selection
  };

  const handleGenerateSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleGenerate(words);
  };

  const handleSaveChanges = () => {
    if (!currentWord) return;

    startSavingTransition(async () => {
        const result = await updateWordExpansionAction(currentWord.id, editedContent);
        if (result.error) {
            toast({
                variant: 'destructive',
                title: 'Save Failed',
                description: result.error,
            });
        } else {
            toast({
                title: 'Changes Saved',
                description: 'Your edits have been successfully saved.',
            });
            setCurrentWord(result.data!);
            setIsEditMode(false);
        }
    });
  }

  const isLoading = isGenerating || isLoadingContent;

  return (
    <>
      <WordSearchModal
        isOpen={isSearchOpen}
        onOpenChange={setIsSearchOpen}
        onSelectWord={handleSelectWordFromSearch}
      />
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
                    <CardTitle>Expand Word(s)</CardTitle>
                    <CardDescription>Enter Greek words, comma-separated.</CardDescription>
                  </CardHeader>
                  <form onSubmit={handleGenerateSubmit}>
                    <CardContent>
                      <Textarea
                        placeholder="e.g., λόγος, ἀγαθός, λύω"
                        value={words}
                        onChange={(e) => setWords(e.target.value)}
                        disabled={isGenerating}
                        className="font-body text-base min-h-[60px]"
                      />
                    </CardContent>
                    <CardFooter>
                      <Button type="submit" disabled={isGenerating || !words.trim()} className="w-full">
                        {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                        {isGenerating ? 'Generating...' : 'Generate'}
                      </Button>
                    </CardFooter>
                  </form>
                </Card>
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle>History</CardTitle>
                        <CardDescription>Previously expanded words.</CardDescription>
                      </div>
                      <Button variant="outline" size="icon" onClick={() => setIsSearchOpen(true)} aria-label="Search within expansions">
                        <Search className="h-4 w-4" />
                        <span className="sr-only">Search Expansions</span>
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                      <ScrollArea className="h-96">
                          {isLoadingList ? (
                              <div className="space-y-2 pr-4">
                                  {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                              </div>
                          ) : Object.keys(groupedAndSortedWords).length > 0 ? (
                              <Accordion type="multiple" className="w-full pr-4">
                                {Object.entries(groupedAndSortedWords).map(([letter, words]) => (
                                    <AccordionItem value={letter} key={letter}>
                                        <AccordionTrigger className="font-headline text-lg">{letter}</AccordionTrigger>
                                        <AccordionContent>
                                            <div className="space-y-1 pl-2">
                                                {words.map((item) => (
                                                    <Button
                                                        key={item.id}
                                                        variant={currentWord?.id === item.id ? 'secondary' : 'ghost'}
                                                        className={cn(
                                                            'w-full justify-start h-auto py-1.5 px-2 text-left font-body text-base font-normal',
                                                            currentWord?.id === item.id && 'bg-accent/20'
                                                        )}
                                                        onClick={() => handleSelectWord(item)}
                                                    >
                                                        {item.word}
                                                    </Button>
                                                ))}
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                          ) : (
                              <div className="text-center text-muted-foreground p-4 text-sm h-full flex items-center justify-center">
                                  <p>No words expanded yet.</p>
                              </div>
                          )}
                      </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            </aside>
            <div className="lg:col-span-8 xl:col-span-9">
              <Card className="min-h-[60vh]">
                  <CardHeader className="flex-row items-center justify-between">
                      <div className="space-y-1">
                          <CardTitle>Analysis</CardTitle>
                          <CardDescription>
                              {currentWord ? `Details for "${currentWord.word}"` : 'Select or generate a word to see its analysis.'}
                          </CardDescription>
                      </div>
                      {currentWord && !isEditMode && (
                          <Button variant="outline" size="sm" onClick={() => setIsEditMode(true)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                          </Button>
                      )}
                  </CardHeader>
                  <CardContent className="p-2 md:p-6 h-full overflow-x-auto">
                      {isLoading ? (
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
                          isEditMode ? (
                              <div className="space-y-4">
                                  <MarkdownEditor
                                      className='w-[89vw] overflow-x-auto'
                                      value={editedContent}
                                      onChange={(value) => setEditedContent(value || '')}
                                  />
                                  <div className="flex justify-end gap-2">
                                      <Button variant="ghost" onClick={() => {
                                          setIsEditMode(false);
                                          setEditedContent(currentWord.expansion);
                                      }}>Cancel</Button>
                                      <Button onClick={handleSaveChanges} disabled={isSaving}>
                                          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                          Save Changes
                                      </Button>
                                  </div>
                              </div>
                          ) : (
                              <div>
                                {/* PLEASE DON'T MODIFY THE WIDTH OF THE PARENT COMPONENT OF THIS VIEWER*/}
                                <MarkdownDisplay markdown={currentWord.expansion} className="md:w-[63vw] overflow-x-auto" />
                              </div>
                          )
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
    </>
  );
}


// The page needs to be wrapped in a Suspense boundary to handle the `useSearchParams` hook.
export default function WordExpansionPageWrapper() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <WordExpansionContent />
    </Suspense>
  );
}
