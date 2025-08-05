
'use client';

import { useState, useTransition } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Search } from 'lucide-react';
import { searchExpandedWordsAction, type ExpandedWordListItem } from '../actions';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface WordSearchModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSelectWord: (word: ExpandedWordListItem) => void;
}

export function WordSearchModal({
  isOpen,
  onOpenChange,
  onSelectWord,
}: WordSearchModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<ExpandedWordListItem[]>([]);
  const [isSearching, startSearchTransition] = useTransition();

  const handleSearch = () => {
    startSearchTransition(async () => {
      if (!searchTerm.trim()) {
        setResults([]);
        return;
      }
      const searchResults = await searchExpandedWordsAction(searchTerm);
      setResults(searchResults);
    });
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleSearch();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Search Expansions</DialogTitle>
          <DialogDescription>
            Find words within the content of your saved word expansions.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleFormSubmit} className="flex gap-2">
          <Input
            placeholder="Search for a Greek word..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="font-body text-base"
          />
          <Button type="submit" disabled={isSearching}>
            {isSearching ? <Loader2 className="animate-spin" /> : <Search />}
            <span className="sr-only">Search</span>
          </Button>
        </form>
        <div className="mt-4 h-80">
          <ScrollArea className="h-full pr-4">
            {isSearching ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : results.length > 0 ? (
              <div className="space-y-2">
                {results.map((item) => (
                  <Button
                    key={item.id}
                    variant="ghost"
                    className="w-full justify-start h-auto py-2 px-3 text-left font-body text-base"
                    onClick={() => onSelectWord(item)}
                  >
                    {item.word}
                  </Button>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground p-4 text-sm h-full flex items-center justify-center">
                <p>Enter a search term to begin.</p>
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
