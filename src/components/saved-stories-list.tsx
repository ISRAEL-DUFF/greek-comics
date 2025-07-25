'use client';

import { useRef } from 'react';
import type { StoryData, SavedStoryListItem } from "@/app/actions";
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { BookMarked, Upload } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import { cn } from "@/lib/utils";
import { z } from 'zod';
import { GlossStoryOutputSchema } from '@/lib/schemas';

interface SavedStoriesListProps {
  stories: SavedStoryListItem[];
  onSelectStory: (story: SavedStoryListItem) => void;
  onStoryImported: (storyData: StoryData | null) => void;
  onImportStarted: () => void;
  currentStoryId: number | null;
}

const DetailedSyntaxSchema = z.object({
  translation: z.string(),
  breakdown: z.string(),
}).optional();

// This schema is more flexible for backward compatibility when importing.
const StoryDataSchema = z.object({
  topic: z.string(),
  story: z.string(),
  sentences: z.array(z.union([
    z.string(), // Old format: array of sentence strings
    z.object({ // New format: array of sentence objects
        sentence: z.string(),
        words: z.array(z.object({
            word: z.string(),
            syntaxNote: z.string().optional().default('N/A'),
        })),
        detailedSyntax: DetailedSyntaxSchema,
    })
  ])),
  illustrations: z.array(z.string()),
  grammar_scope: z.string(),
  level: z.string(),
  glosses: GlossStoryOutputSchema.optional().default({}),
});


type ImportResult = {
  data?: StoryData;
  error?: string;
};


const isSupabaseEnabled = !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function SavedStoriesList({ stories, onSelectStory, onStoryImported, onImportStarted, currentStoryId }: SavedStoriesListProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  async function importStoryFrontend(fileContent: string): Promise<ImportResult> {
    try {
      const json = JSON.parse(fileContent);
      const validatedData = StoryDataSchema.safeParse(json);
  
      if (!validatedData.success) {
        console.error("Zod validation error:", validatedData.error.flatten());
        return { error: `Invalid JSON format. ${validatedData.error.flatten().formErrors.join(', ')}` };
      }
  
      return { data: validatedData.data as StoryData };
  
    } catch (error) {
      if (error instanceof SyntaxError) {
        return { error: "Invalid JSON file. Could not parse the file content." };
      }
      console.error("Error importing story:", error);
      return { error: "An unexpected error occurred while importing the story." };
    }
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    onImportStarted();

    const fileContent = await file.text();
    const result = await importStoryFrontend(fileContent);

    if (result.error) {
      toast({
        variant: 'destructive',
        title: 'Import Failed',
        description: result.error,
      });
      onStoryImported(null);
    } else if (result.data) {
      toast({
        title: 'Story Imported',
        description: `Successfully loaded "${result.data.topic}".`,
      });
      onStoryImported(result.data);
    }
    
    // Reset file input to allow importing the same file again
    if(fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <CardTitle className="font-headline text-2xl flex items-center gap-2">
                <BookMarked />
                Saved Stories
                </CardTitle>
                <CardDescription>Select a story to view it again.</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={handleImportClick}>
                <Upload className="mr-2 h-4 w-4" />
                Import
            </Button>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".json"
                className="hidden"
            />
        </div>
      </CardHeader>
      <CardContent>
        { !isSupabaseEnabled && stories.length === 0 ? (
          <div className="text-center text-muted-foreground p-4 text-sm">
            <p>Story saving is disabled.</p>
            <p className="text-xs">Configure Supabase environment variables to enable saving stories to the cloud.</p>
          </div>
        ) : (
          <ScrollArea className="h-72">
            {stories.length > 0 ? (
              <div className="space-y-2 pr-4">
                {stories.map(story => (
                  <Button
                    key={story.id}
                    variant={story.id === currentStoryId ? "secondary" : "ghost"}
                    className={cn(
                      "w-[70vw] lg:w-full justify-start h-auto py-2 px-3 text-left",
                      story.id === currentStoryId && "bg-accent/20"
                    )}
                    onClick={() => onSelectStory(story)}
                  >
                    <div className="w-full">
                      <p className="font-semibold truncate w-full">
                        {story.topic || 'Untitled Story'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {story.level} &bull; Saved {formatDistanceToNow(new Date(story.created_at), { addSuffix: true })}
                      </p>
                      <p className="text-xs text-muted-foreground truncate w-full">
                        {story.grammar_scope}
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
        )}
      </CardContent>
    </Card>
  );
}
