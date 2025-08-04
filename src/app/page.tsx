'use client';

import { useState, useEffect } from 'react';
import { StoryGeneratorForm } from '@/components/story-generator-form';
import { StoryDisplay } from '@/components/story-display';
import type { StoryResult, SavedStoryListItem, StoryData, GlossStoryOutput, Sentence } from '@/app/actions';
import { getSavedStoriesAction, getStoryByIdAction } from '@/app/actions';
import { SavedStoriesList } from '@/components/saved-stories-list';

/**
 * Creates a modern `Sentence[]` array from a simple story string.
 * This is a backward-compatibility helper for older saved stories.
 * @param storyText The full story as a single string.
 * @returns An array of Sentence objects.
 */
function createSentencesFromStory(storyText: string): Sentence[] {
    // Split the story into sentences using punctuation as delimiters.
    const sentenceStrings = storyText.match(/[^.!?]+[.!?]+/g) || [storyText];
    
    return sentenceStrings.map(s => {
      const trimmedSentence = s.trim();
      // Split the sentence into words and create the word objects.
      const words = trimmedSentence.split(/\s+/).map(w => ({ word: w, syntaxNote: 'N/A' }));
      return { sentence: trimmedSentence, words }; // detailedSyntax will be undefined
    });
}


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
      // BACKWARD COMPATIBILITY CHECK:
      // Check if the loaded story has the new `sentences.words` array of objects.
      // If not, it's an old story format, and we need to convert it.
      const sentences = (fullStory.sentences && fullStory.sentences.length > 0 && typeof fullStory.sentences[0] !== 'string' && fullStory.sentences[0].words)
        ? fullStory.sentences
        : createSentencesFromStory(fullStory.story);

      setStoryResult({
        data: {
          story: fullStory.story,
          sentences: sentences,
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
  
  const handleGlossesRegenerated = (newGlosses: GlossStoryOutput) => {
    setStoryResult(prevResult => {
      if (!prevResult || !prevResult.data) {
        return prevResult;
      }
      return {
        ...prevResult,
        data: {
          ...prevResult.data,
          glosses: newGlosses,
        },
      };
    });
  };
  
  const handleImportedStory = (importedData: StoryData | null) => {
    if (importedData) {
      // BACKWARD COMPATIBILITY: Run the same checks as for saved stories.
      const sentences = (importedData.sentences && importedData.sentences.length > 0 && typeof importedData.sentences[0] !== 'string' && importedData.sentences[0].words)
        ? importedData.sentences
        : createSentencesFromStory(importedData.story);
      
      const storyDataWithCompatibility = {
        ...importedData,
        sentences,
      };

      setStoryResult({ data: storyDataWithCompatibility });
      setCurrentStoryId(null);
    }
    // This will be called after the import action is complete, successful or not.
    setIsLoadingSaved(false);
  };
  
  const handleImportStarted = () => {
    setIsLoadingSaved(true);
    setStoryResult(null);
    setCurrentStoryId(null);
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
                  onStoryImported={handleImportedStory}
                  onImportStarted={handleImportStarted}
                  currentStoryId={currentStoryId}
                />
             </div>
          </aside>
          <div className="lg:col-span-8 xl:col-span-9">
            <StoryDisplay 
              storyResult={storyResult} 
              isLoading={isLoading || isLoadingSaved} 
              onStorySaved={handleStorySaved} 
              currentStoryId={currentStoryId}
              onGlossesRegenerated={handleGlossesRegenerated}
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
