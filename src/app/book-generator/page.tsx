
'use client';

import { useState } from 'react';
import { BookGeneratorForm } from './components/book-generator-form';
import { BookDisplay } from './components/book-display';
import { SavedBooksList } from './components/saved-books-list';
import type { BookResult, BookData } from './actions';
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
import { Card } from '@/components/ui/card';

export default function BookGeneratorPage() {
  const [bookResult, setBookResult] = useState<BookResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSaved, setIsLoadingSaved] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showImages, setShowImages] = useState(true);
  const [showTranslation, setShowTranslation] = useState(true);
  const [showSyntax, setShowSyntax] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSavedOpen, setIsSavedOpen] = useState(false);


  const handleBookGenerated = (result: BookResult | null) => {
    if(result) {
      setBookResult(result);
    }
    setIsCreateOpen(false); // Close modal on generation
  };

  const handleImportedBook = (importedData: BookData | null) => {
    if (importedData) {
      setBookResult({ data: importedData });
    }
    // This will be called after the import action is complete, successful or not.
    setIsLoadingSaved(false);
    setIsSavedOpen(false); // Close modal on import
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
        />
    );
  }


  return (
    <div className="flex min-h-screen w-full flex-col bg-background text-foreground">
      <main className="container mx-auto flex-1 px-4 py-8">
        <div className="text-center mb-12">
            <h1 className="font-headline text-4xl font-bold text-primary">Book Generator</h1>
            <p className="mt-1 text-lg text-muted-foreground">Generate a complete, illustrated book in Ancient Greek.</p>
        </div>

        {/* Mobile View: Modals */}
        <div className="lg:hidden mb-6 grid grid-cols-2 gap-4">
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create New Book
                </Button>
              </DialogTrigger>
              <DialogContent>
                 <BookGeneratorForm
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
                        View Saved Books
                    </Button>
                </DialogTrigger>
                <DialogContent>
                     <SavedBooksList 
                        onBookImported={handleImportedBook}
                        onImportStarted={handleImportStarted}
                    />
                </DialogContent>
            </Dialog>
        </div>

        <div className="grid gap-12 lg:grid-cols-12">
          {/* Desktop View: Sidebar */}
          <aside className="no-print hidden lg:block lg:col-span-4 xl:col-span-3">
             <div className="sticky top-24 space-y-8">
                <BookGeneratorForm
                    setBookResult={handleBookGenerated}
                    setIsLoading={setIsLoading}
                    isLoading={isLoading}
                />
                <SavedBooksList 
                  onBookImported={handleImportedBook}
                  onImportStarted={handleImportStarted}
                />
             </div>
          </aside>
          
          {/* Main Content */}
          <div className="lg:col-span-8 xl:col-span-9">
            <BookDisplay
              bookResult={bookResult} 
              isLoading={isLoading || isLoadingSaved}
              onEnterFullscreen={() => setIsFullscreen(true)}
              showImages={showImages}
              setShowImages={setShowImages}
              showTranslation={showTranslation}
              setShowTranslation={setShowTranslation}
              showSyntax={showSyntax}
              setShowSyntax={setShowSyntax}
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
