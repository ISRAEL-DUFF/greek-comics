'use client';

import { useState, useEffect } from 'react';
import { StoryGeneratorForm } from '@/components/story-generator-form';
import { StoryDisplay } from '@/components/story-display';
import type { StoryResult, SavedStoryListItem } from '@/app/actions';
import { getSavedStoriesAction, getStoryByIdAction } from '@/app/actions';
import { SavedStoriesList } from '@/components/saved-stories-list';

export default function Home() {
  const [storyResult, setStoryResult] = useState<StoryResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSaved, setIsLoadingSaved] = useState(false);
  const [savedStories, setSavedStories] = useState<SavedStoryListItem[]>([]);
  const [currentStoryId, setCurrentStoryId] = useState<number | null>(null);

  const fetchSavedStories = async () => {
    const stories = await getSavedStoriesAction();
    setSavedStories(stories);
  };

  useEffect(() => {
    fetchSavedStories();
  }, []);

  const handleStoryGenerated = (result: StoryResult | null) => {
    if(result) {
      setStoryResult(result);
      setCurrentStoryId(null); 
    }
  };
  
  const handleStorySaved = () => {
    fetchSavedStories();
  };
  
  const handleSelectStory = async (storyListItem: SavedStoryListItem) => {
    setIsLoadingSaved(true);
    setCurrentStoryId(storyListItem.id);
    setStoryResult(null); // Clear previous story

    const fullStory = await getStoryByIdAction(storyListItem.id);
    
    if (fullStory) {
      setStoryResult({
        data: {
          story: fullStory.story,
          // Simple sentence splitting for display.
          sentences: fullStory.story.match(/[^.!?]+[.!?]+/g) || [fullStory.story],
          illustrations: fullStory.illustrations,
          level: fullStory.level,
          topic: fullStory.topic,
          grammar_scope: fullStory.grammar_scope,
          glosses: fullStory.glosses || {},
        },
      });
    } else {
      setStoryResult({
        error: "Could not load the selected story. It may have been deleted."
      });
    }
    setIsLoadingSaved(false);
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-background text-foreground">
      <header className="no-print sticky top-0 z-10 border-b bg-background/80 py-4 backdrop-blur-sm">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-headline text-4xl font-bold text-primary">Ἑλληνικὰ Κόμιξ</h1>
          <p className="mt-1 text-lg text-muted-foreground">Ancient Greek Illustrated Story Generator</p>
        </div>
      </header>
      <main className="container mx-auto flex-1 px-4 py-8">
        <div className="grid gap-12 lg:grid-cols-12">
          <aside className="no-print lg:col-span-4 xl:col-span-3">
             <div className="sticky top-24 space-y-8">
                <StoryGeneratorForm 
                  setStoryResult={handleStoryGenerated} 
                  setIsLoading={setIsLoading} 
                  isLoading={isLoading} 
                />
                <SavedStoriesList
                  stories={savedStories} 
                  onSelectStory={handleSelectStory} 
                  currentStoryId={currentStoryId}
                />
             </div>
          </aside>
          <div className="lg:col-span-8 xl:col-span-9">
            <StoryDisplay 
              storyResult={storyResult} 
              isLoading={isLoading || isLoadingSaved} 
              onStorySaved={handleStorySaved} 
            />
          </div>
        </div>
      </main>
      <footer className="no-print py-6 text-center text-sm text-muted-foreground">
        <p>Built with Next.js and Genkit. Illustrations and stories are AI-generated.</p>
      </footer>
    </div>
  );
}
