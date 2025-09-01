
'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { getNotes, getNoteById, type Note } from './actions';
import { NoteList } from './components/note-list';
import { NoteEditor } from './components/note-editor';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Sidebar,
  SidebarContent,
  SidebarInset,
  SidebarTrigger,
  SidebarProvider
} from '@/components/ui/sidebar';
import './notes.css';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function NotesPage() {
  const [allNotes, setAllNotes] = useState<Note[]>([]);
  const [isLoadingNotes, setIsLoadingNotes] = useState(true);
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  
  const [openTabs, setOpenTabs] = useState<Note[]>([]);
  const [activeTabId, setActiveTabId] = useState<number | null>(null);

  const { toast } = useToast();

  const OPEN_TABS_LS_KEY = 'notes.openTabs.v1';

  // Fetch initial list of all notes
  const fetchNotes = async () => {
    setIsLoadingNotes(true);
    const notes = await getNotes();
    setAllNotes(notes);
    setIsLoadingNotes(false);
  };

  // Restore open tabs from localStorage on first render
  useEffect(() => {
    fetchNotes(); // Fetch all notes on mount
    try {
      const raw = localStorage.getItem(OPEN_TABS_LS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Note[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setOpenTabs(parsed);
          const lastActiveTab = parsed[parsed.length - 1];
          if (lastActiveTab) {
            setActiveTabId(lastActiveTab.id);
          }
        }
      }
    } catch (err) {
      console.warn('Failed to restore open tabs from localStorage', err);
    }
  }, []);

  // Persist openTabs to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(OPEN_TABS_LS_KEY, JSON.stringify(openTabs));
    } catch (err) {
      console.warn('Failed to persist open tabs to localStorage', err);
    }
  }, [openTabs]);

  const addTabAndActivate = (note: Note) => {
    setOpenTabs((prev) => {
      const exists = prev.find((p) => p.id === note.id);
      if (exists) return prev;
      return [...prev, note];
    });
    setActiveTabId(note.id);
  };

  const handleSelectNote = async (noteId: number) => {
    // If tab is already open, just activate it
    const existingTab = openTabs.find(tab => tab.id === noteId);
    if (existingTab) {
      setActiveTabId(noteId);
      return;
    }

    setIsLoadingContent(true);
    const fullNote = await getNoteById(noteId);
    if (fullNote) {
      addTabAndActivate(fullNote);
    } else {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not load the selected note.',
      });
    }
    setIsLoadingContent(false);
  };

  const handleNoteCreated = (newNote: Note) => {
    setAllNotes(prev => [newNote, ...prev]);
    addTabAndActivate(newNote);
  };

  const handleNoteDeleted = (noteId: number) => {
    setAllNotes(prev => prev.filter(n => n.id !== noteId));
    closeTab(noteId, true);
  };
  
  const handleNoteUpdated = (updatedNote: Note) => {
    // Update the note in the main list
    setAllNotes(prev => prev.map(n => n.id === updatedNote.id ? updatedNote : n));
    // Update the note in the open tabs
    setOpenTabs(prev => prev.map(t => t.id === updatedNote.id ? updatedNote : t));
  };

  const closeTab = (id: number, isDeletion = false) => {
    setOpenTabs((prev) => {
      const tabIndex = prev.findIndex(p => p.id === id);
      if (tabIndex === -1) return prev;

      const newTabs = prev.filter(p => p.id !== id);

      // If the closed tab was the active one, determine the next active tab
      if (activeTabId === id) {
        let nextActiveId: number | null = null;
        if (newTabs.length > 0) {
          // Try to activate the tab to the left, otherwise the new last one
          nextActiveId = (newTabs[tabIndex] || newTabs[tabIndex - 1] || newTabs[newTabs.length - 1]).id;
        }
        setActiveTabId(nextActiveId);
      }
      
      if (!isDeletion) {
         toast({ title: "Tab Closed" });
      }

      return newTabs;
    });
  };

  const activeNote = openTabs.find(tab => tab.id === activeTabId) || null;

  return (
    <SidebarProvider>
      <Sidebar side="left" collapsible="icon" className="border-r">
        <SidebarContent className='text-foreground'>
          <NoteList 
            notes={allNotes} 
            isLoading={isLoadingNotes}
            onSelectNote={handleSelectNote}
            onNoteCreated={handleNoteCreated}
            onNoteDeleted={handleNoteDeleted}
          />
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b px-4 backdrop-blur-sm sm:justify-end">
          <SidebarTrigger className="md:hidden" />
          {/* Header actions can go here */}

          {/* Tabs Bar */}
          {openTabs.length > 0 && (
            <div className="flex-shrink-0 border-b backdrop-blur-sm">
                <ScrollArea className='w-[80vw] scroll-both'>
                    <div className="flex items-center gap-1 p-1">
                        {openTabs.map(tab => (
                            <div
                            key={tab.id}
                            className={cn(
                                'flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-md border text-sm flex-shrink-0',
                                activeTabId === tab.id ? 'bg-primary/10 border-primary' : 'bg-transparent border-transparent hover:bg-muted'
                            )}
                            >
                            <button
                                className="font-medium max-w-[28ch] truncate"
                                onClick={() => setActiveTabId(tab.id)}
                            >
                                {tab.title || 'Untitled Note'}
                            </button>
                            <button
                                className="text-muted-foreground hover:text-foreground rounded-full p-0.5 hover:bg-black/10"
                                onClick={() => closeTab(tab.id)}
                                aria-label={`Close ${tab.title}`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </div>
          )}

        </header>
        <main className="flex-1 overflow-auto notes-background flex flex-col">
          {/* Tabs Bar */}
          {/* {openTabs.length > 0 && (
            <div className="flex-shrink-0 border-b bg-background/80 backdrop-blur-sm">
                <ScrollArea className='w-full'>
                    <div className="flex items-center gap-1 p-1">
                        {openTabs.map(tab => (
                            <div
                            key={tab.id}
                            className={cn(
                                'flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-md border text-sm flex-shrink-0',
                                activeTabId === tab.id ? 'bg-primary/10 border-primary' : 'bg-transparent border-transparent hover:bg-muted'
                            )}
                            >
                            <button
                                className="font-medium max-w-[28ch] truncate"
                                onClick={() => setActiveTabId(tab.id)}
                            >
                                {tab.title || 'Untitled Note'}
                            </button>
                            <button
                                className="text-muted-foreground hover:text-foreground rounded-full p-0.5 hover:bg-black/10"
                                onClick={() => closeTab(tab.id)}
                                aria-label={`Close ${tab.title}`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </div>
          )} */}

          {/* Editor Area */}
          <div className="flex-1 min-h-0">
             {isLoadingContent ? (
                <div className="p-8 space-y-4">
                    <Skeleton className="h-10 w-1/2" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                </div>
            ) : (
                <NoteEditor 
                  key={activeNote?.id ?? 'empty'} // Force re-mount when note changes
                  note={activeNote} 
                  onNoteUpdated={handleNoteUpdated}
                />
            )}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
