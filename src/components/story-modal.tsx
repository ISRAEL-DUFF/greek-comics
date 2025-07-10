'use client';

import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { StoryDisplay } from './story-display';
import type { StoryData } from '@/app/actions';
import { ScrollArea } from './ui/scroll-area';
import { cn } from '@/lib/utils';

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
      <DialogContent 
        className={cn(
          "flex flex-col p-0 max-w-none",
          "md:w-[90vw] md:h-[90vh] md:rounded-lg",
          "w-screen h-screen rounded-none"
        )}
      >
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
