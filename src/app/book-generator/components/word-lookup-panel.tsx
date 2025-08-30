
'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, CheckCircle2, AlertTriangle, Trash2, XCircle } from 'lucide-react';
import type { LookupState } from '@/hooks/use-word-lookup';
import { WordExpansionViewer } from './word-expansion-viewer';
import { Badge } from '@/components/ui/badge';

interface WordLookupPanelProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  lookupState: LookupState;
  removeWord: (word: string) => void;
  dialogClassName?: string;
}

export function WordLookupPanel({
  isOpen,
  onOpenChange,
  lookupState,
  removeWord,
  dialogClassName
}: WordLookupPanelProps) {
  const [selectedWord, setSelectedWord] = useState<string | null>(null);

  const handleSelectWord = (word: string) => {
    if (lookupState[word]?.status === 'ready') {
      setSelectedWord(word);
    }
  };

  const handleCloseViewer = () => {
    setSelectedWord(null);
  };
  
  const handleClosePanel = () => {
    // Also ensure the individual viewer is closed when the main panel closes
    handleCloseViewer();
    onOpenChange(false);
  }

  const wordList = Object.keys(lookupState);
  const expansionData = selectedWord ? lookupState[selectedWord]?.expansion : null;

  return (
    <>
      <WordExpansionViewer
        isOpen={!!selectedWord && !!expansionData}
        onClose={handleCloseViewer}
        word={selectedWord || ''}
        expansion={expansionData || ''}
      />

      <Dialog open={isOpen} onOpenChange={handleClosePanel}>
        <DialogContent className={`h-full max-h-[90svh] w-full max-w-4xl flex flex-col ${dialogClassName ?? ''}`}>
          <DialogHeader>
            <DialogTitle>Word Lookup Panel</DialogTitle>
            <DialogDescription>
              Words you've selected for expansion appear here. Expansions are
              generated automatically.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 min-h-0">
            <ScrollArea className="h-full pr-4">
              {wordList.length > 0 ? (
                <ul className="space-y-2">
                  {wordList.map((word) => {
                    const item = lookupState[word];
                    return (
                      <li
                        key={word}
                        className="flex items-center justify-between p-3 rounded-lg bg-card border"
                      >
                        <div className="flex-1">
                          <button
                            className="text-left disabled:cursor-not-allowed"
                            onClick={() => handleSelectWord(word)}
                            disabled={item.status !== 'ready'}
                          >
                            <p className="font-semibold text-lg">{word}</p>
                            <div className="flex items-center gap-2 mt-1">
                                {item.status === 'pending' && <Badge variant="outline">Pending</Badge>}
                                {item.status === 'loading' && <Badge variant="secondary"><Loader2 className="mr-1 h-3 w-3 animate-spin" />Expanding...</Badge>}
                                {item.status === 'ready' && <Badge variant="default" className="bg-green-600"><CheckCircle2 className="mr-1 h-3 w-3" />Ready</Badge>}
                                {item.status === 'error' && <Badge variant="destructive"><AlertTriangle className="mr-1 h-3 w-3" />Error</Badge>}
                            </div>
                          </button>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeWord(word)}
                          aria-label={`Remove ${word}`}
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="text-center text-muted-foreground p-8 h-full flex flex-col items-center justify-center">
                  <XCircle className="h-12 w-12 mb-4 text-muted-foreground/50"/>
                  <p className="font-semibold">The lookup panel is empty.</p>
                  <p className="text-sm">Click on words in the story to add them here.</p>
                </div>
              )}
            </ScrollArea>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleClosePanel}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
