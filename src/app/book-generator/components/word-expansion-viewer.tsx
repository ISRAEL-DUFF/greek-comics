
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
  // return (
  //   <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
  //     <DialogContent className="h-full max-h-[90svh] w-full max-w-4xl flex flex-col">
  //       <DialogHeader>
  //         <DialogTitle className="font-headline text-3xl">{word}</DialogTitle>
  //         <DialogDescription>
  //           Detailed grammatical and etymological analysis.
  //         </DialogDescription>
  //       </DialogHeader>
  //       <div className="flex-1 min-h-0">
  //         <ScrollArea className="h-full pr-2 w-[90vw]">
  //           <MarkdownDisplay markdown={expansion} className="w-[80%] overflow-x-auto" /> 
  //         </ScrollArea>
  //       </div>
  //       <DialogFooter>
  //         <Button variant="outline" onClick={onClose}>
  //           Close
  //         </Button>
  //       </DialogFooter>
  //     </DialogContent>
  //   </Dialog>
  // );
  return (
    // Mobile-first: dialog opens full-viewport on small screens, becomes centered modal on larger screens
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="m-0 h-full w-full max-h-[100svh] flex flex-col p-4 sm:rounded-lg sm:m-auto sm:max-w-4xl sm:max-h-[90svh] sm:p-6">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl sm:text-3xl truncate">{word}</DialogTitle>
          <DialogDescription className="text-sm sm:text-base">
            Detailed grammatical and etymological analysis.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 mt-2 w-[90vw]">
          {/* ScrollArea takes full available height; MarkdownDisplay uses full width and prevents horizontal overflow */}
          <ScrollArea className="h-full pr-2  scroll-both">
            <div className="inline-block">
              <MarkdownDisplay
                markdown={expansion}
                className="sm:w-[87vw] md:w-[50vw] overflow-x-scroll"
              />
            </div>
          </ScrollArea>
        </div>

        <DialogFooter className="mt-3">
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
