
'use client';

import React, { useState, useEffect, useTransition, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  getExpandedWordsAction,
  getExpandedWordByIdAction,
  generateAndSaveWordExpansionAction,
  updateWordExpansionAction,
  getAllTagsAction,
  addTagToWordAction,
  removeTagFromWordAction,
  addTagToWordsBulkAction,
  getWordsByTagAction,
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Copy, Tags, Plus, X, XCircle } from 'lucide-react';

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

  const [isExpandModalOpen, setIsExpandModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isTagsModalOpen, setIsTagsModalOpen] = useState(false);

  // Tags state
  const [allTags, setAllTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [bulkTagInput, setBulkTagInput] = useState('');
  const [loadingTag, setLoadingTag] = useState<string | null>(null);
  
  // Tabs: open generated/selected words in UI tabs (not browser tabs)
  const [openTabs, setOpenTabs] = useState<ExpandedWord[]>([]);
  const [activeTabId, setActiveTabId] = useState<number | null>(null);

  // Local storage key (bump version if shape changes in future)
  const OPEN_TABS_LS_KEY = 'wordExpansion.openTabs.v1';

  // Restore open tabs from localStorage on first render
  useEffect(() => {
    try {
      const raw = localStorage.getItem(OPEN_TABS_LS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Basic validation of parsed items (id and word expected)
          const validTabs = parsed.filter((p: any) => p && typeof p.id === 'number' && typeof p.word === 'string');
          if (validTabs.length > 0) {
            setOpenTabs(validTabs);
            // restore last active tab (prefer last used)
            const restoredActive = validTabs.find((t: any) => t.id === (activeTabId ?? validTabs[validTabs.length - 1].id)) ?? validTabs[validTabs.length - 1];
            setActiveTabId(restoredActive.id);
            setCurrentWord(restoredActive);
            setEditedContent(restoredActive.expansion ?? '');
          }
        }
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('Failed to restore open tabs from localStorage', err);
    }
    // only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist openTabs to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(OPEN_TABS_LS_KEY, JSON.stringify(openTabs));
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('Failed to persist open tabs to localStorage', err);
    }
  }, [openTabs]);

  const { toast } = useToast();

  const fetchExpandedWords = async () => {
    setIsLoadingList(true);
    const words = await getExpandedWordsAction();
    setAllExpandedWords(words);
    setIsLoadingList(false);
  };

  const fetchAllTags = async () => {
    const tags = await getAllTagsAction();
    setAllTags(tags);
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
        toast({
          title: 'Expansion Complete',
          description: `Successfully generated details for ${result.data.length} word(s).`,
        });
        
        // Open all newly generated words in tabs
        openMultipleTabsAndActivateLast(result.data);
        
        setWords(''); // Clear input on success
        fetchExpandedWords(); // Refresh the history list
      }
    });
  };

  useEffect(() => {
    fetchExpandedWords();
    fetchAllTags();
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
      // Open selected history word in a tab
      addTabAndActivate(fullWord);
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
            // also update any open tab for this word
            setOpenTabs(prev => prev.map(t => t.id === result.data!.id ? result.data! : t));
            setIsEditMode(false);
        }
    });
  }
  
  const isLoading = isGenerating || isLoadingContent;

  const addTabAndActivate = (wordItem: ExpandedWord) => {
    setOpenTabs((prev) => {
      const exists = prev.find((p) => p.id === wordItem.id);
      if (exists) return prev;
      return [...prev, wordItem];
    });
    setActiveTabId(wordItem.id);
    setCurrentWord(wordItem);
    setEditedContent(wordItem.expansion);
  };

  const openMultipleTabsAndActivateLast = (newWords: ExpandedWord[]) => {
    if (!newWords || newWords.length === 0) return;
    
    setOpenTabs(prev => {
        const newTabs = [...prev];
        const existingIds = new Set(prev.map(t => t.id));
        newWords.forEach(word => {
            if (!existingIds.has(word.id)) {
                newTabs.push(word);
            }
        });
        return newTabs;
    });

    // Activate the last word in the new list
    const lastWord = newWords[newWords.length - 1];
    setActiveTabId(lastWord.id);
    setCurrentWord(lastWord);
    setEditedContent(lastWord.expansion);
  }

  const closeTab = (id: number) => {
    setOpenTabs((prev) => {
      const next = prev.filter((p) => p.id !== id);
      // if the closed tab was active, pick a sensible next active tab
      if (activeTabId === id) {
        const idx = prev.findIndex(p => p.id === id);
        // prefer previous tab, otherwise next, otherwise null
        const newActive = (idx > 0 ? prev[idx - 1] : (prev[idx + 1] ?? null));
        if (newActive) {
          setActiveTabId(newActive.id);
          setCurrentWord(newActive);
          setEditedContent(newActive.expansion);
        } else {
          setActiveTabId(null);
          setCurrentWord(null);
          setEditedContent('');
        }
      }
      return next;
    });
  };

  const clearAllTabs = () => {
    if (openTabs.length === 0) return;
    setOpenTabs([]);
    setActiveTabId(null);
    setCurrentWord(null);
    setEditedContent('');
    try {
      localStorage.setItem(OPEN_TABS_LS_KEY, JSON.stringify([]));
    } catch {}
    toast({ title: 'Tabs Cleared', description: 'All open tabs have been closed.' });
  };

  // Tagging handlers
  const handleAddTagToCurrent = async () => {
    const t = tagInput.trim();
    if (!currentWord || !t) return;
    const { data, error } = await addTagToWordAction(currentWord.id, t);
    if (error) {
      toast({ variant: 'destructive', title: 'Tag failed', description: error });
      return;
    }
    if (data) {
      setCurrentWord(data);
      setOpenTabs(prev => prev.map(tab => tab.id === data.id ? data : tab));
      setTagInput('');
      fetchAllTags();
      toast({ title: 'Tagged', description: `Added "${t}"` });
    }
  };

  const handleRemoveTagFromCurrent = async (tag: string) => {
    if (!currentWord) return;
    const { data, error } = await removeTagFromWordAction(currentWord.id, tag);
    if (error) {
      toast({ variant: 'destructive', title: 'Untag failed', description: error });
      return;
    }
    if (data) {
      setCurrentWord(data);
      setOpenTabs(prev => prev.map(tab => tab.id === data.id ? data : tab));
      fetchAllTags();
    }
  };

  const handleBulkTagOpenTabs = async () => {
    const t = bulkTagInput.trim();
    if (!t || openTabs.length === 0) return;
    const ids = openTabs.map(tw => tw.id);
    const { updated, error } = await addTagToWordsBulkAction(ids, t);
    if (error) {
      toast({ variant: 'destructive', title: 'Bulk tag failed', description: error });
    } else {
      toast({ title: 'Bulk tagged', description: `Applied "${t}" to ${updated} tab(s).` });
    }
    // Refresh any current/open tabs data to get updated tags
    if (currentWord) {
      const refreshed = await getExpandedWordByIdAction(currentWord.id);
      if (refreshed) setCurrentWord(refreshed);
    }
    setOpenTabs(prev => prev.map(asyncTab => asyncTab)); // keep as-is; optimistic
    setBulkTagInput('');
    fetchAllTags();
  };

  const handleOpenWordsByTag = async (tag: string) => {
    setLoadingTag(tag);
    toast({ title: 'Loading', description: `Fetching words for "${tag}"...`, duration: 1200 });
    try {
      const list = await getWordsByTagAction(tag);
      if (!list || list.length === 0) {
        toast({ title: 'No results', description: `No entries found for "${tag}"` });
        return;
      }
      openMultipleTabsAndActivateLast(list);
      setIsTagsModalOpen(false);
      toast({ title: 'Loaded', description: `Opened ${list.length} word(s) tagged "${tag}".` });
    } finally {
      setLoadingTag(null);
    }
  };

  return (
    <>
      <WordSearchModal
        isOpen={isSearchOpen}
        onOpenChange={setIsSearchOpen}
        onSelectWord={handleSelectWordFromSearch}
      />
      <div className="flex min-h-screen w-full flex-col bg-background text-foreground">
        <main className="container mx-auto flex-1 px-4 py-8">
          <div className="text-center mb-12">
            <h1 className="font-headline text-4xl font-bold text-primary">Word Expansion Tool</h1>
            <p className="mt-1 text-lg text-muted-foreground">Detailed Greek Word Analysis</p>
          </div>
          <div className="grid gap-12 lg:grid-cols-12">
            {/* MOBILE: show two buttons that open modals */}
            <div className="lg:hidden mb-6 flex gap-3 justify-center">
              <Button onClick={() => setIsExpandModalOpen(true)} className="flex-1 max-w-xs">
                Expand Word(s)
              </Button>
              <Button variant="outline" onClick={() => setIsHistoryModalOpen(true)} className="flex-1 max-w-xs">
                History
              </Button>
            </div>

            {/* Desktop sidebar */}
            <aside className="hidden lg:block lg:col-span-4 xl:col-span-3">
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

            {/* Expand modal (mobile) */}
            <Dialog open={isExpandModalOpen} onOpenChange={setIsExpandModalOpen}>
              <DialogContent className="m-0 h-full w-full max-h-[100svh] flex flex-col p-4 sm:rounded-lg sm:m-auto sm:max-w-lg sm:max-h-[90svh]">
                <DialogHeader>
                  <DialogTitle>Expand Word(s)</DialogTitle>
                </DialogHeader>
                <div className="flex-1 overflow-auto mt-4 pt-4">
                  <Card>
                    <form onSubmit={(e) => { e.preventDefault(); handleGenerate(words); setIsExpandModalOpen(false); }}>
                      <CardContent>
                        <Textarea
                          placeholder="e.g., λόγος, ἀγαθός, λύω"
                          value={words}
                          onChange={(e) => setWords(e.target.value)}
                          disabled={isGenerating}
                          className="font-body text-base min-h-[60px] mt-6"
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
                </div>
              </DialogContent>
            </Dialog>

            {/* History modal (mobile) */}
            <Dialog open={isHistoryModalOpen} onOpenChange={setIsHistoryModalOpen}>
              <DialogContent className="m-0 h-full w-full max-h-[100svh] flex flex-col p-4 sm:rounded-lg sm:m-auto sm:max-w-lg sm:max-h-[90svh]">
                <DialogHeader>
                  <DialogTitle>History</DialogTitle>
                </DialogHeader>
                <div className="flex-1 overflow-auto mt-2">
                  <Card>
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <div>
                          <CardDescription>Previously expanded words.</CardDescription>
                        </div>
                        <Button variant="outline" size="icon" onClick={() => { setIsSearchOpen(true); setIsHistoryModalOpen(false); }} aria-label="Search within expansions">
                          <Search className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[60vh]">
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
                                        onClick={() => { handleSelectWord(item); setIsHistoryModalOpen(false); }}
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
              </DialogContent>
            </Dialog>
            <div className="lg:col-span-8 xl:col-span-9">
              <Card className="min-h-[60vh]">
                  <CardHeader className="flex-row items-start justify-between">
                      <div className="space-y-1 w-full">
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle>Analysis</CardTitle>
                              <CardDescription>
                                {currentWord ? `Details for "${currentWord.word}"` : 'Select or generate a word to see its analysis.'}
                              </CardDescription>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap justify-end">
                              {/* Mobile: icon-only */}
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setIsTagsModalOpen(true)}
                                className="sm:hidden"
                                aria-label="Tags"
                              >
                                <Tags className="h-4 w-4" />
                              </Button>
                              {openTabs.length > 0 && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={clearAllTabs}
                                  className="sm:hidden"
                                  aria-label="Clear tabs"
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              )}
                              {currentWord && !isEditMode && (
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => setIsEditMode(true)}
                                  className="sm:hidden"
                                  aria-label="Edit"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              )}

                              {/* Desktop/tablet: labeled */}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsTagsModalOpen(true)}
                                className="hidden sm:flex"
                              >
                                <Tags className="mr-2 h-4 w-4" />
                                Tags
                              </Button>
                              {openTabs.length > 0 && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={clearAllTabs}
                                  className="hidden sm:flex"
                                >
                                  <XCircle className="mr-2 h-4 w-4" />
                                  Clear Tabs
                                </Button>
                              )}
                              {currentWord && !isEditMode && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setIsEditMode(true)}
                                  className="hidden sm:flex"
                                >
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </Button>
                              )}
                            </div>
                          </div>

                          {/* Tags controls */}
                          {currentWord && (
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                              {(currentWord.tags ?? []).map((t) => (
                                <Badge key={t} variant="secondary" className="flex items-center gap-1">
                                  {t}
                                  <button aria-label={`Remove tag ${t}`} onClick={() => handleRemoveTagFromCurrent(t)} className="ml-1 hover:text-destructive">
                                    <X className="h-3 w-3" />
                                  </button>
                                </Badge>
                              ))}
                            </div>
                          )}

                          {/* Tabs bar */}
                          {openTabs.length > 0 && (
                            <div className="mt-3 flex gap-2 overflow-x-auto pb-2 w-[75vw]">
                              {openTabs.map(tab => (
                                <div
                                  key={tab.id}
                                  className={cn(
                                    'flex items-center gap-2 px-3 py-1 rounded-md border',
                                    activeTabId === tab.id ? 'bg-accent/10 border-accent' : 'bg-transparent border-transparent'
                                  )}
                                >
                                  <button
                                    className="text-sm font-medium max-w-[28ch] truncate"
                                    onClick={() => {
                                      setActiveTabId(tab.id);
                                      setCurrentWord(tab);
                                      setEditedContent(tab.expansion);
                                    }}
                                  >
                                    {tab.word}
                                  </button>
                                  <button
                                    className="text-xs text-muted-foreground ml-2"
                                    onClick={() => closeTab(tab.id)}
                                    aria-label={`Close ${tab.word}`}
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                              <div className="flex items-center">
                                <Button variant="ghost" size="sm" onClick={clearAllTabs}>
                                  <XCircle className="mr-2 h-4 w-4" />
                                  Clear All
                                </Button>
                              </div>
                            </div>
                          )}
                      </div>
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
                               <div className="md:w-[64vw] w-[89vw]">
                                 {/* PLEASE DON'T MODIFY THE WIDTH OF THE PARENT COMPONENT OF THIS VIEWER*/}
                                <MarkdownDisplay markdown={currentWord.expansion} className="w-[98%] overflow-x-auto" />
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
      {/* Tags Modal: list and open-by-tag */}
      <Dialog open={isTagsModalOpen} onOpenChange={setIsTagsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tags</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Tag editors in modal */}
            <div className="grid gap-3">
              <div className="flex items-center gap-2">
                <Input
                  placeholder={currentWord ? `Add tag to "${currentWord.word}"...` : 'Select a word to tag'}
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTagToCurrent(); } }}
                  className="h-8"
                  disabled={!currentWord}
                />
                <Button size="sm" variant="outline" onClick={handleAddTagToCurrent} disabled={!currentWord || !tagInput.trim()}>
                  <Plus className="mr-1 h-3 w-3" /> Add to current
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  placeholder={openTabs.length > 0 ? 'Tag all open tabs...' : 'Open tabs to bulk tag'}
                  value={bulkTagInput}
                  onChange={(e) => setBulkTagInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleBulkTagOpenTabs(); } }}
                  className="h-8"
                  disabled={openTabs.length === 0}
                />
                <Button size="sm" variant="outline" onClick={handleBulkTagOpenTabs} disabled={openTabs.length === 0 || !bulkTagInput.trim()}>
                  <Plus className="mr-1 h-3 w-3" /> Tag tabs
                </Button>
              </div>
            </div>

            {/* Existing tags list */}
            {allTags.length === 0 ? (
              <div className="text-sm text-muted-foreground">No tags yet.</div>
            ) : (
              <ScrollArea className="h-72 pr-2">
                <div className="grid grid-cols-1 gap-2">
                  {allTags.map((t) => (
                    <div key={t} className="flex items-center justify-between gap-2 border rounded-md px-2 py-1">
                      <div className="truncate" title={t}>{t}</div>
                      <div className="flex items-center gap-1">
                        <Button size="sm" variant="ghost" onClick={async () => { await navigator.clipboard.writeText(t); }} aria-label={`Copy ${t}`}>
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button size="sm" onClick={() => handleOpenWordsByTag(t)} disabled={loadingTag === t}>
                          {loadingTag === t ? (<><Loader2 className="mr-1 h-4 w-4 animate-spin" /> Loading</>) : 'Open'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </DialogContent>
      </Dialog>
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
