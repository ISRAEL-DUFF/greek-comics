'use client';

import type { SavedStoryListItem } from "@/app/actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { BookMarked } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import { cn } from "@/lib/utils";

interface SavedStoriesListProps {
  stories: SavedStoryListItem[];
  onSelectStory: (story: SavedStoryListItem) => void;
  currentStoryId: number | null;
}

const isSupabaseEnabled = !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function SavedStoriesList({ stories, onSelectStory, currentStoryId }: SavedStoriesListProps) {
  if (!isSupabaseEnabled) {
    return null;
  }
  
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-2xl flex items-center gap-2">
          <BookMarked />
          Saved Stories
        </CardTitle>
        <CardDescription>Select a story to view it again.</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-72">
          {stories.length > 0 ? (
            <div className="space-y-2 pr-4">
              {stories.map(story => (
                <Button
                  key={story.id}
                  variant={story.id === currentStoryId ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start h-auto py-2 px-3 text-left",
                    story.id === currentStoryId && "bg-accent/20"
                  )}
                  onClick={() => onSelectStory(story)}
                >
                  <div>
                    <p className="font-semibold truncate">
                      {story.story.substring(0, 40)}...
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Saved {formatDistanceToNow(new Date(story.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </Button>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground p-4">
              <p>You haven't saved any stories yet.</p>
              <p className="text-xs">Once you save a story, it will appear here.</p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
