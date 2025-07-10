'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { StoryDisplay } from './story-display';
import type { StoryData } from '@/app/actions';
import { ScrollArea } from './ui/scroll-area';

interface StoryModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  storyData: StoryData;
  onStorySaved: () => void;
}

export function StoryModal({
  isOpen,
  onOpenChange,
  storyData,
  onStorySaved,
}: StoryModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-none w-[90vw] h-[90vh] flex flex-col p-0">
        <ScrollArea className="h-full w-full">
           <div className="p-8 md:p-12">
             <StoryDisplay
                storyData={storyData}
                isLoading={false}
                onStorySaved={onStorySaved}
              />
           </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
