
'use client';

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
import { MarkdownDisplay } from '@/components/markdown-display';

interface WordExpansionViewerProps {
  isOpen: boolean;
  onClose: () => void;
  word: string;
  expansion: string;
}

export function WordExpansionViewer({
  isOpen,
  onClose,
  word,
  expansion,
}: WordExpansionViewerProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="h-full max-h-[90svh] w-full max-w-4xl flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-headline text-3xl">{word}</DialogTitle>
          <DialogDescription>
            Detailed grammatical and etymological analysis.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 min-h-0">
          <ScrollArea className="h-full pr-6">
            <MarkdownDisplay markdown={expansion} className="w-full" />
          </ScrollArea>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
