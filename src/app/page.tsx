'use client';

import { useState, useEffect } from 'react';
import { StoryGeneratorForm } from '@/components/story-generator-form';
import { StoryModal } from '@/components/story-modal';
import type { StoryResult, SavedStoryListItem, StoryData } from '@/app/actions';
import { getSavedStoriesAction, getStoryByIdAction } from '@/app/actions';
import { SavedStoriesList } from '@/components/saved-stories-list';
import { BookOpen } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function Home() {
  const [storyResult, setStoryResult] = useState<StoryResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSaved, setIsLoadingSaved] = useState(false);
  const [savedStories, setSavedStories] = useState<SavedStoryListItem[]>([]);
  const [currentStoryId, setCurrentStoryId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStoryData, setModalStoryData] = useState<StoryData | null>(null);

  const fetchSavedStories = async () => {
    const stories = await getSavedStoriesAction();
    setSavedStories(stories);
  };

  useEffect(() => {
    fetchSavedStories();
  }, []);

  const handleStoryGenerated = (result: StoryResult) => {
    setStoryResult(result);
    setCurrentStoryId(null);
    if (result.data) {
      setModalStoryData(result.data);
      setIsModalOpen(true);
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
      const storyData: StoryData = {
        story: fullStory.story,
        // Simple sentence splitting for display.
        sentences: fullStory.story.match(/[^.!?]+[.!?]+/g) || [fullStory.story],
        illustrations: fullStory.illustrations,
      };
      setModalStoryData(storyData);
      setIsModalOpen(true);
    } else {
      setStoryResult({
        error: "Could not load the selected story. It may have been deleted."
      });
    }
    setIsLoadingSaved(false);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
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
            {isLoading || isLoadingSaved ? (
              <div className="space-y-16">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex flex-col md:flex-row gap-8 items-center">
                    <div className="w-full md:w-1/2">
                      <div className="w-full aspect-square rounded-lg bg-muted animate-pulse" />
                    </div>
                    <div className="w-full md:w-1/2 space-y-3">
                      <div className="h-5 w-full bg-muted animate-pulse rounded-md" />
                      <div className="h-5 w-5/6 bg-muted animate-pulse rounded-md" />
                      <div className="h-5 w-3/4 bg-muted animate-pulse rounded-md" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
               <Card className="flex h-96 flex-col items-center justify-center p-8 text-center border-dashed">
                <BookOpen className="h-16 w-16 text-muted-foreground/50" />
                <h3 className="mt-4 text-xl font-semibold font-headline">
                  Your Story Awaits
                </h3>
                <p className="mt-2 text-muted-foreground">
                  Use the form to generate a new illustrated story, or select a saved one.
                </p>
              </Card>
            )}
          </div>
        </div>
      </main>
      <footer className="no-print py-6 text-center text-sm text-muted-foreground">
        <p>Built with Next.js and Genkit. Illustrations and stories are AI-generated.</p>
      </footer>

      {modalStoryData && (
        <StoryModal
          isOpen={isModalOpen}
          onOpenChange={setIsModalOpen}
          storyData={modalStoryData}
          onStorySaved={handleStorySaved}
        />
      )}
    </div>
  );
}
