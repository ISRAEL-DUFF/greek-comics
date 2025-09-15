
'use client';

import { useState } from 'react';
import { VocabMemorizeForm } from './components/vocab-memorize-form';
import { VocabMemorizeDisplay } from './components/vocab-memorize-display';
import { SavedBooksList } from './components/saved-books-list';
import { getBookByIdAction, type BookData, type SavedBookListItem } from './actions';
import type { BookResult } from './actions';
import { FullscreenBookViewer } from './components/fullscreen-book-viewer';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { BookMarked, PlusCircle } from 'lucide-react';
import { WordLookupPanel } from './components/word-lookup-panel';
import { useWordLookup } from '@/hooks/use-word-lookup';


export default function VocabMemorizePage() {
  const [bookResult, setBookResult] = useState<BookResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSaved, setIsLoadingSaved] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showImages, setShowImages] = useState(true);
  const [showTranslation, setShowTranslation] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSavedOpen, setIsSavedOpen] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const wordLookup = useWordLookup();

  const handleBookGenerated = (result: BookResult | null) => {
    if(result) {
      setBookResult(result);
    }
    wordLookup.clearPanel(); // Clear the panel when a new book is generated
    setIsCreateOpen(false); // Close modal on generation
  };

  const handleImportedBook = (importedData: BookData | null) => {
    if (importedData) {
      setBookResult({ data: importedData });
    }
    wordLookup.clearPanel(); // Clear the panel when a new book is imported
    setIsLoadingSaved(false);
    setIsSavedOpen(false); // Close modal on import
  };
  
  const handleSelectSavedBook = async (item: SavedBookListItem) => {
    setIsLoadingSaved(true);
    setBookResult(null);
    const data = await getBookByIdAction(item.id);
    if (data) {
      setBookResult({ data });
    } else {
      setBookResult({ error: 'Could not load the selected book.' });
    }
    setIsLoadingSaved(false);
  };
  
  const handleImportStarted = () => {
    setIsLoadingSaved(true);
    setBookResult(null);
  };

  if (isFullscreen && bookResult?.data) {
    return (
        <FullscreenBookViewer 
            bookData={bookResult.data}
            onExitFullscreen={() => setIsFullscreen(false)}
            showImages={showImages}
            showTranslation={showTranslation}
            onAddWordToPanel={wordLookup.addWord}
            onOpenPanel={() => setIsPanelOpen(true)}
            pendingWordCount={wordLookup.pendingCount}
            lookupState={wordLookup.lookupState}
           removeWord={wordLookup.removeWord}
        />
    );
  }


  return (
    <div className="flex min-h-screen w-full flex-col bg-background text-foreground">
      <WordLookupPanel
        isOpen={isPanelOpen}
        onOpenChange={setIsPanelOpen}
        lookupState={wordLookup.lookupState}
        removeWord={wordLookup.removeWord}
      />
       <main className="container mx-auto flex-1 px-4 py-8">
        <div className="text-center mb-12">
            <h1 className="font-headline text-4xl font-bold text-primary">Vocabulary Memorizer</h1>
            <p className="mt-1 text-lg text-muted-foreground">Generate a story to help you memorize a list of words.</p>
        </div>

        {/* Mobile View: Modals */}
        <div className="lg:hidden mb-6 grid grid-cols-2 gap-4">
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create New Story
                </Button>
              </DialogTrigger>
              <DialogContent>
                 <DialogHeader>
                    <DialogTitle>Create New Story</DialogTitle>
                 </DialogHeader>
                 <VocabMemorizeForm
                    setBookResult={handleBookGenerated}
                    setIsLoading={setIsLoading}
                    isLoading={isLoading}
                />
              </DialogContent>
            </Dialog>

            <Dialog open={isSavedOpen} onOpenChange={setIsSavedOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline">
                        <BookMarked className="mr-2 h-4 w-4" />
                        View Saved Stories
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>View Saved Stories</DialogTitle>
                    </DialogHeader>
                     <SavedBooksList 
                        onBookImported={handleImportedBook}
                        onImportStarted={handleImportStarted}
                        onSavedBookSelected={handleSelectSavedBook}
                    />
                </DialogContent>
            </Dialog>
        </div>

        <div className="grid gap-12 lg:grid-cols-12">
          {/* Desktop View: Sidebar */}
          <aside className="no-print hidden lg:block lg:col-span-4 xl:col-span-3">
             <div className="sticky top-24 space-y-8">
                <VocabMemorizeForm
                    setBookResult={handleBookGenerated}
                    setIsLoading={setIsLoading}
                    isLoading={isLoading}
                />
                <SavedBooksList 
                  onBookImported={handleImportedBook}
                  onImportStarted={handleImportStarted}
                  onSavedBookSelected={handleSelectSavedBook}
                />
             </div>
          </aside>
          
          {/* Main Content */}
          <div className="lg:col-span-8 xl:col-span-9">
            <VocabMemorizeDisplay
              bookResult={bookResult} 
              isLoading={isLoading || isLoadingSaved}
              onEnterFullscreen={() => setIsFullscreen(true)}
              showImages={showImages}
              setShowImages={setShowImages}
              showTranslation={showTranslation}
              setShowTranslation={setShowTranslation}
              onAddWordToPanel={wordLookup.addWord}
              onOpenPanel={() => setIsPanelOpen(true)}
              pendingWordCount={wordLookup.pendingCount}
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
