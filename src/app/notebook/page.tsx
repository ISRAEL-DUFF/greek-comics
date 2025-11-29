'use client';

import React, { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { Plus, Search, Edit3, Check, Trash2, Save, Loader2, Tags, MoreVertical, Folder as FolderIcon, FolderPlus, Sigma, Pilcrow, Book } from 'lucide-react';
import { getNotes, getNoteById, createNote, updateNote, deleteNote, type Note, type NotebookBook, getNotebookBooks, createNotebookBook, updateNotebookBook, deleteNotebookBook } from '@/app/notes/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { MarkdownEditor } from '@/components/markdown-editor';
import { MarkdownDisplay } from '@/components/markdown-display';
import { MarkdownMathjaxDisplay } from '@/components/markdown-mathjax-display';
import { cn } from '@/lib/utils';
import { BookView } from '@/components/book-view';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import './notebook.css';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
} from '@/components/ui/dropdown-menu';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// ... existing imports


export default function NotebookPage() {
  const { toast } = useToast();

  const [notes, setNotes] = useState<Note[]>([]);
  const [books, setBooks] = useState<NotebookBook[]>([]);
  const [filtered, setFiltered] = useState<(Note | NotebookBook)[]>([]);
  const [active, setActive] = useState<Note | NotebookBook | null>(null);
  const [openTabs, setOpenTabs] = useState<(Note | NotebookBook)[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, startSaving] = useTransition();
  const [query, setQuery] = useState('');
  const [isEdit, setIsEdit] = useState(false);
  const [showLines, setShowLines] = useState(false);
  const [mobileView, setMobileView] = useState<'list' | 'page'>('list');
  const [isDesktop, setIsDesktop] = useState(false);
  const [restored, setRestored] = useState(false);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [editorType, setEditorType] = useState<'default' | 'math' | 'book'>('default');
  const [selectedFolder, setSelectedFolder] = useState<'all' | 'unfiled' | string>('all');

  const prevId = useRef<number | undefined>(undefined);
  const OPEN_TABS_LS_KEY = 'notebook.openTabs.v1';
  const OPEN_TAB_IDS_LS_KEY = 'notebook.openTabIds.v1';
  const ACTIVE_TAB_ID_LS_KEY = 'notebook.activeTabId.v1';

  useEffect(() => {
    const mq = typeof window !== 'undefined' ? window.matchMedia('(min-width: 768px)') : null;
    const handle = () => setIsDesktop(!!mq?.matches);
    handle();
    mq?.addEventListener('change', handle);

    (async () => {
      setIsLoading(true);
      const [notesList, booksList] = await Promise.all([getNotes(), getNotebookBooks()]);
      setNotes(notesList);
      setBooks(booksList);
      setIsLoading(false);

      try {
        const idsRaw = localStorage.getItem(OPEN_TAB_IDS_LS_KEY);
        if (idsRaw) {
          const idsParsed = JSON.parse(idsRaw);
          if (Array.isArray(idsParsed) && idsParsed.length > 0) {
            const restoredTabs: (Note | NotebookBook)[] = [];
            for (const item of idsParsed) {
              if (typeof item === 'number') {
                const n = notesList.find(n => n.id === item);
                if (n) restoredTabs.push(n);
              } else if (typeof item === 'string') {
                const [type, idStr] = item.split('-');
                const id = parseInt(idStr);
                if (type === 'note') {
                  const n = notesList.find(n => n.id === id);
                  if (n) restoredTabs.push(n);
                } else if (type === 'book') {
                  const b = booksList.find(b => b.id === id);
                  if (b) restoredTabs.push(b);
                }
              }
            }

            if (restoredTabs.length > 0) {
              setOpenTabs(restoredTabs);
              const storedActive = localStorage.getItem(ACTIVE_TAB_ID_LS_KEY);
              let candidateId = storedActive;
              if (storedActive && !isNaN(Number(storedActive)) && !storedActive.includes('-')) {
                candidateId = `note-${storedActive}`;
              }

              const candidate = restoredTabs.find(t => getTabId(t) === candidateId) || restoredTabs[restoredTabs.length - 1];
              if (candidate) setActiveTabId(getTabId(candidate));

              setMobileView('page');
              return;
            }
          }
        }
      } catch {
        // ignore
      } finally {
        setRestored(true);
      }
    })();

    return () => mq?.removeEventListener('change', handle);
  }, []);

  useEffect(() => {
    const q = query.trim().toLowerCase();
    const allItems = [...books, ...notes].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    if (!q) {
      setFiltered(allItems);
    } else {
      setFiltered(
        allItems.filter(n =>
          (n.title || '').toLowerCase().includes(q) ||
          ('content' in n && (n.content || '').toLowerCase().includes(q)) ||
          ('tags' in n && (n.tags as string[] || []).some(t => (t || '').toLowerCase().includes(q)))
        )
      );
    }
  }, [notes, books, query]);

  useEffect(() => {
    try {
      if (!restored) return;
      const ids = openTabs.map(t => getTabId(t));
      localStorage.setItem(OPEN_TAB_IDS_LS_KEY, JSON.stringify(ids));
    } catch { }
  }, [openTabs, restored]);

  useEffect(() => {
    try {
      if (!restored) return;
      if (activeTabId != null) {
        localStorage.setItem(ACTIVE_TAB_ID_LS_KEY, activeTabId);
      } else {
        localStorage.removeItem(ACTIVE_TAB_ID_LS_KEY);
      }
    } catch { }
  }, [activeTabId, restored]);

  const getTabId = (item: Note | NotebookBook) => 'content' in item ? `note-${item.id}` : `book-${item.id}`;

  useEffect(() => {
    if (activeTabId == null) {
      setActive(null);
      return;
    }
    const n = openTabs.find(t => getTabId(t) === activeTabId) || null;
    setActive(n);
  }, [activeTabId, openTabs]);

  useEffect(() => {
    if (!active) return;
    if (prevId.current !== active.id) {
      setTitle(active.title || '');
      if ('content' in active) {
        setContent(active.content || '');
        setTags(active.tags || []);
        setEditorType(active.editor_type || 'default');
      } else {
        // It's a book
        setContent('');
        setTags([]);
        setEditorType('book');
      }
      setIsEdit(false);
      prevId.current = active.id;
    }
  }, [active]);

  const addTabAndActivate = (item: Note | NotebookBook) => {
    setOpenTabs(prev => (prev.some(p => p.id === item.id && ('content' in p) === ('content' in item)) ? prev : [...prev, item]));
    setActiveTabId(getTabId(item));
  };



  const openItem = (item: Note | NotebookBook) => {
    addTabAndActivate(item);
    setMobileView('page');
  };

  const [isCreationDialogOpen, setIsCreationDialogOpen] = useState(false);
  const [creationType, setCreationType] = useState<'note' | 'book'>('note');

  const NewCreationDialog = () => {
    const [localTitle, setLocalTitle] = useState('');
    const [localEditorType, setLocalEditorType] = useState<'default' | 'math'>('default');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!localTitle.trim()) return;
      setIsSubmitting(true);

      if (creationType === 'book') {
        const book = await createNotebookBook(localTitle);
        if (book) {
          setBooks(prev => [book, ...prev]);
          addTabAndActivate(book);
          toast({ title: 'New book created' });
          setIsCreationDialogOpen(false);
        } else {
          toast({ variant: 'destructive', title: 'Failed to create book' });
        }
      } else {
        const note = await createNote(localTitle, null, localEditorType);
        if (note) {
          setNotes(prev => [note, ...prev]);
          addTabAndActivate(note);
          setIsEdit(true);
          toast({ title: 'New note created' });
          setIsCreationDialogOpen(false);
        } else {
          toast({ variant: 'destructive', title: 'Failed to create note' });
        }
      }
      setIsSubmitting(false);
    };

    return (
      <Dialog open={isCreationDialogOpen} onOpenChange={setIsCreationDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New {creationType === 'book' ? 'Book' : 'Note'}</DialogTitle>
            <DialogDescription>Enter a title for your new {creationType}.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" value={localTitle} onChange={e => setLocalTitle(e.target.value)} placeholder={`My New ${creationType === 'book' ? 'Book' : 'Note'}`} autoFocus />
              </div>
              {creationType === 'note' && (
                <div className="grid gap-2">
                  <Label>Editor Type</Label>
                  <RadioGroup value={localEditorType} onValueChange={(v: 'default' | 'math') => setLocalEditorType(v)} className="flex gap-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="default" id="r-default" />
                      <Label htmlFor="r-default">Default (Markdown)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="math" id="r-math" />
                      <Label htmlFor="r-math">Math (MathJax)</Label>
                    </div>
                  </RadioGroup>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setIsCreationDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={!localTitle.trim() || isSubmitting}>Create</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    );
  };

  const [moveNoteId, setMoveNoteId] = useState<number | null>(null);
  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);

  const MoveToBookDialog = () => {
    const [selectedBookId, setSelectedBookId] = useState<string>('new');
    const [newBookTitle, setNewBookTitle] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleMove = async () => {
      if (!moveNoteId) return;
      setIsSubmitting(true);

      let targetBookId: number;

      if (selectedBookId === 'new') {
        if (!newBookTitle.trim()) return;
        const newBook = await createNotebookBook(newBookTitle);
        if (!newBook) {
          toast({ variant: 'destructive', title: 'Failed to create book' });
          setIsSubmitting(false);
          return;
        }
        setBooks(prev => [newBook, ...prev]);
        targetBookId = newBook.id;
      } else {
        targetBookId = parseInt(selectedBookId);
      }

      await updateNote({ id: moveNoteId, notebook_book_id: targetBookId });

      // Remove from main notes list
      setNotes(prev => prev.filter(n => n.id !== moveNoteId));

      // If active, update it or close it? 
      // If it's active, we might want to keep it open but it's now part of a book.
      // Ideally, we should switch view to the book.
      const book = books.find(b => b.id === targetBookId) || (selectedBookId === 'new' ? (await getNotebookBooks()).find(b => b.id === targetBookId) : null);

      if (book) {
        // Close the note tab if open
        closeTab(`note-${moveNoteId}`);
        // Open the book
        addTabAndActivate(book);
      }

      toast({ title: 'Note moved to book' });
      setIsMoveDialogOpen(false);
      setMoveNoteId(null);
      setIsSubmitting(false);
    };

    return (
      <Dialog open={isMoveDialogOpen} onOpenChange={setIsMoveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add to Book</DialogTitle>
            <DialogDescription>Select a book to add this note to, or create a new one.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Select Book</Label>
              <Select value={selectedBookId} onValueChange={setSelectedBookId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a book" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">+ Create New Book</SelectItem>
                  {books.map(b => (
                    <SelectItem key={b.id} value={String(b.id)}>{b.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedBookId === 'new' && (
              <div className="grid gap-2">
                <Label>New Book Title</Label>
                <Input value={newBookTitle} onChange={e => setNewBookTitle(e.target.value)} placeholder="My New Book" />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsMoveDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleMove} disabled={isSubmitting || (selectedBookId === 'new' && !newBookTitle.trim())}>Move</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  const persist = async () => {
    if (!active) return;
    startSaving(async () => {
      if ('content' in active) {
        const eType = editorType === 'book' ? 'default' : editorType;
        const updatedNoteData: Partial<Note> = { id: active.id, title, content, tags, editor_type: eType };
        await updateNote(updatedNoteData);
        const updated: Note = { ...active, ...updatedNoteData } as Note;

        setNotes(prev => prev.map(n => (n.id === updated.id ? updated : n)));
        setOpenTabs(prev => prev.map(t => (t.id === updated.id ? updated : t)));
        setActive(updated);
      } else {
        const updatedBookData: Partial<NotebookBook> = { id: active.id, title };
        await updateNotebookBook(updatedBookData);
        const updated: NotebookBook = { ...active, ...updatedBookData } as NotebookBook;

        setBooks(prev => prev.map(b => (b.id === updated.id ? updated : b)));
        setOpenTabs(prev => prev.map(t => (t.id === updated.id ? updated : t)));
        setActive(updated);
      }
      toast({ title: 'Saved' });
    });
  };

  const handleEditorTypeChange = async (newType: 'default' | 'math') => {
    if (!active || !('content' in active)) return;
    setEditorType(newType);
    startSaving(async () => {
      await updateNote({ id: active.id, editor_type: newType });
      const updated: Note = { ...active, editor_type: newType };
      setActive(updated);
      setNotes(prev => prev.map(n => (n.id === updated.id ? updated : n)));
      setOpenTabs(prev => prev.map(t => (t.id === updated.id ? updated : t)));
      toast({ title: 'Editor type updated' });
    });
  };

  const remove = async () => {
    if (!active) return;
    if ('content' in active) {
      await deleteNote(active.id);
      setNotes(prev => prev.filter(n => n.id !== active.id));
    } else {
      await deleteNotebookBook(active.id);
      setBooks(prev => prev.filter(b => b.id !== active.id));
    }
    closeTab(getTabId(active), true);
    toast({ title: 'Item deleted' });
  };

  const addTagFromInput = () => {
    const t = tagInput.trim();
    if (!t) return;
    if (!tags.includes(t)) setTags(prev => [...prev, t]);
    setTagInput('');
  };

  const removeTag = (t: string) => setTags(prev => prev.filter(x => x !== t));

  const closeTab = (tabId: string, isDeletion = false) => {
    setOpenTabs(prev => {
      const idx = prev.findIndex(p => getTabId(p) === tabId);
      if (idx === -1) return prev;
      const newTabs = prev.filter(p => getTabId(p) !== tabId);
      if (activeTabId === tabId) {
        let next: string | null = null;
        if (newTabs.length > 0) {
          const nextItem = newTabs[idx] || newTabs[idx - 1] || newTabs[newTabs.length - 1];
          next = getTabId(nextItem);
        }
        setActiveTabId(next);
        if (!isDeletion && !isDesktop && next == null) setMobileView('list');
      }
      if (!isDeletion) toast({ title: 'Tab Closed' });
      return newTabs;
    });
  };

  type FolderNode = { name: string; path: string; children: Record<string, FolderNode> };
  const { folderTree, allFolderPaths } = React.useMemo(() => {
    const tree: Record<string, FolderNode> = {};
    const paths = new Set<string>();
    for (const n of notes) {
      if (!n.folder_path) continue;
      paths.add(n.folder_path);
      const parts = n.folder_path.split(':');
      let current = tree;
      let currentPath = '';
      parts.forEach((part, idx) => {
        currentPath = idx === 0 ? part : `${currentPath}:${part}`;
        if (!current[part]) current[part] = { name: part, path: currentPath, children: {} };
        current = current[part].children;
      });
    }
    return { folderTree: tree, allFolderPaths: Array.from(paths).sort() };
  }, [notes]);

  const visibleNotes: (Note | NotebookBook)[] = React.useMemo(() => {
    const base = filtered;
    if (selectedFolder === 'all') return base;
    if (selectedFolder === 'unfiled') return base.filter(n => !('folder_path' in n) || !n.folder_path);
    return base.filter(n => 'folder_path' in n && n.folder_path === selectedFolder);
  }, [filtered, selectedFolder]);

  const handleMoveNote = async (noteId: number, folderPath: string | null) => {
    await updateNote({ id: noteId, folder_path: folderPath });
    setNotes(prev => prev.map(n => (n.id === noteId ? { ...n, folder_path: folderPath } : n)));
    setActive(prev => (prev?.id === noteId ? { ...(prev as Note), folder_path: folderPath } : prev));
    toast({ title: 'Note moved' });
  };

  const createFolderWithNote = async (path: string) => {
    const note = await createNote('Untitled Note', path);
    if (note) {
      setNotes(prev => [note, ...prev]);
      addTabAndActivate(note);
      setSelectedFolder(path);
      setMobileView('page');
      toast({ title: 'Folder created', description: 'A new note was created inside the folder.' });
    } else {
      toast({ variant: 'destructive', title: 'Failed to create folder/note' });
    }
  };

  const FolderDialog = ({ onDone, existingPaths }: { onDone: (p: string) => void; existingPaths: string[] }) => {
    const [path, setPath] = useState('');
    const [error, setError] = useState('');
    const submit = (e: React.FormEvent) => {
      e.preventDefault();
      const finalPath = path.trim();
      if (!finalPath) return;
      if (existingPaths.includes(finalPath)) {
        setError('A folder with this path already exists.');
        return;
      }
      if (/[^a-zA-Z0-9_:-]/.test(finalPath)) {
        setError('Use letters, numbers, underscores, and colons only.');
        return;
      }
      onDone(finalPath);
    };
    return (
      <form onSubmit={submit}>
        <DialogHeader>
          <DialogTitle>New Folder</DialogTitle>
          <DialogDescription>Use colons to create nested folders. Example: school:notes:science</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Label htmlFor="folder-path">Path</Label>
          <Input id="folder-path" value={path} onChange={(e) => { setPath(e.target.value); setError(''); }} placeholder="e.g., work:2024:meeting-notes" />
          {error && <p className="text-sm text-destructive mt-1">{error}</p>}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="ghost">Cancel</Button>
          </DialogClose>
          <Button type="submit" disabled={!path.trim()}>Create</Button>
        </DialogFooter>
      </form>
    );
  };


  const FolderRenderer = ({ nodes }: { nodes: Record<string, FolderNode> }) => (
    <div className="w-full">
      {Object.values(nodes).sort((a, b) => a.name.localeCompare(b.name)).map(node => (
        <AccordionItem value={node.path} key={node.path}>
          <AccordionTrigger>
            <span
              className={cn('flex items-center gap-2 text-left flex-1', selectedFolder === node.path && 'text-primary')}
              onClick={(e) => { e.stopPropagation(); setSelectedFolder(node.path); }}
            >
              <FolderIcon className="h-4 w-4" />
              <span className="truncate">{node.name}</span>
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <FolderRenderer nodes={node.children} />
          </AccordionContent>
        </AccordionItem>
      ))}
    </div>
  );

  return (
    <div className={cn('notebook-root flex min-h-[calc(100vh-56px)] w-full bg-slate-50 text-foreground')}>
      <div className="notebook-gutter hidden md:block" />
      <div className="flex w-full flex-col md:flex-row">
        <aside
          className={cn(
            'border-b bg-white/70 backdrop-blur-sm md:border-b-0 md:border-r',
            mobileView === 'list' ? 'block' : 'hidden',
            'md:block md:w-80'
          )}
        >
          <div className="flex items-center gap-2 p-3 border-b">
            <Button className="gap-2" onClick={() => { setCreationType('note'); setIsCreationDialogOpen(true); }}><Plus className="h-4 w-4" /> New</Button>
            <Button variant="outline" size="icon" onClick={() => { setCreationType('book'); setIsCreationDialogOpen(true); }} title="New Book"><Book className="h-4 w-4" /></Button>
            <NewCreationDialog />
            <MoveToBookDialog />
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon" aria-label="New Folder">
                  <FolderPlus className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <FolderDialog existingPaths={allFolderPaths} onDone={(path) => {
                  createFolderWithNote(path);
                  const btn = document.querySelector('[data-radix-dialog-close]') as HTMLElement | null;
                  btn?.click();
                }} />
              </DialogContent>
            </Dialog>
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search notes..." className="pl-8" />
            </div>
          </div>

          <ScrollArea className="soft-scrollbars h-[calc(100svh-56px-49px)] md:h-[calc(100vh-56px-49px)]">
            <div className="p-2 space-y-3">
              <Accordion type="multiple" defaultValue={[...allFolderPaths]} className="w-full">
                <div className="flex items-center gap-2 px-1">
                  <Button size="sm" variant={selectedFolder === 'all' ? 'default' : 'outline'} onClick={() => setSelectedFolder('all')}>All</Button>
                  <Button size="sm" variant={selectedFolder === 'unfiled' ? 'default' : 'outline'} onClick={() => setSelectedFolder('unfiled')}>Unfiled</Button>
                </div>
                <div className="px-1">
                  <FolderRenderer nodes={folderTree} />
                </div>
              </Accordion>
              <div className="h-px bg-slate-200" />
              {isLoading && (
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-16 animate-pulse rounded-md bg-slate-100" />
                ))
              )}
              {!isLoading && visibleNotes.length === 0 && (
                <div className="text-sm text-muted-foreground p-4 text-center">No notes found</div>
              )}
              {!isLoading && visibleNotes.map(n => (
                <div
                  key={`${'content' in n ? 'note' : 'book'}-${n.id}`}
                  onClick={() => openItem(n)}
                  className={cn(
                    'w-full rounded-md border p-3 text-left transition-colors hover:bg-amber-50 cursor-pointer',
                    active?.id === n.id ? 'bg-amber-50 border-amber-300' : 'bg-white border-slate-200'
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="sticky-label inline-block rounded px-2 py-1 text-sm font-medium flex-1 min-w-0 truncate">{n.title || 'Untitled Note'}</div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost" className="h-8 w-8 flex-shrink-0 opacity-100 text-muted-foreground hover:text-foreground z-10" onClick={(e) => e.stopPropagation()}>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {'folder_path' in n && (
                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger>Move to</DropdownMenuSubTrigger>
                            <DropdownMenuPortal>
                              <DropdownMenuSubContent>
                                <DropdownMenuItem onClick={() => handleMoveNote(n.id, null)}>
                                  Unfiled Notes
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {allFolderPaths.map(path => (
                                  <DropdownMenuItem key={path} onClick={() => handleMoveNote(n.id, path)}>
                                    {path.replace(/:/g, ' / ')}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuSubContent>
                            </DropdownMenuPortal>
                          </DropdownMenuSub>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setMoveNoteId(n.id); setIsMoveDialogOpen(true); }}>
                          <Book className="mr-2 h-4 w-4" /> Add to Book
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation(); setActiveTabId(getTabId(n)); remove(); }}>
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  {('tags' in n) && n.tags?.length ? (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {n.tags.slice(0, 4).map(t => (
                        <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
                      ))}
                      {n.tags.length > 4 && (<Badge variant="outline" className="text-xs">+{n.tags.length - 4}</Badge>)}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </ScrollArea>
        </aside>

        <section
          className={cn(
            'flex-1 py-4 px-3 md:py-6 md:px-8 lg:px-12',
            mobileView === 'page' ? 'block' : 'hidden',
            'md:block'
          )}
        >
          {openTabs.length > 0 && (
            <div className="mb-2">
              <div className="w-full overflow-x-auto">
                <div className="flex items-center gap-1 p-1">
                  {openTabs.map(tab => (
                    <div
                      key={getTabId(tab)}
                      className={cn(
                        'flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-md border text-sm flex-shrink-0',
                        activeTabId === getTabId(tab) ? 'bg-primary/10 border-primary' : 'bg-transparent border-transparent hover:bg-muted'
                      )}
                    >
                      <button
                        className="font-medium max-w-[28ch] truncate"
                        onClick={() => setActiveTabId(getTabId(tab))}
                      >
                        {tab.title || 'Untitled Note'}
                      </button>
                      <button
                        className="text-muted-foreground hover:text-foreground rounded-full p-0.5 hover:bg-black/10"
                        onClick={() => closeTab(getTabId(tab))}
                        aria-label={`Close ${tab.title}`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className={cn('paper rounded-xl overflow-hidden', showLines && 'lined')}>
            <div className="flex items-center justify-between gap-2 border-b bg-white/70 px-2 py-2 backdrop-blur-sm md:px-4">
              <div className="flex items-center gap-3">
                {!isDesktop && (
                  <Button variant="ghost" size="sm" onClick={() => setMobileView('list')}>
                    ← Back
                  </Button>
                )}
                {isSaving && (<span className="inline-flex items-center text-xs text-muted-foreground"><Loader2 className="mr-1 h-3 w-3 animate-spin" />Saving</span>)}
                <div className="flex items-center gap-2 pl-1">
                  <Switch id="lines-toggle" checked={showLines} onCheckedChange={setShowLines} />
                  <Label htmlFor="lines-toggle" className="text-xs md:text-sm text-muted-foreground">Lines</Label>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {active && (
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="editor-type-switch" className="text-xs text-muted-foreground flex items-center gap-1">
                      {editorType === 'default' ? <Pilcrow className="h-4 w-4" /> : <Sigma className="h-4 w-4" />}
                    </Label>
                    <Switch id="editor-type-switch"
                      checked={editorType === 'math'}
                      onCheckedChange={(checked) => handleEditorTypeChange(checked ? 'math' : 'default')}
                    />
                  </div>
                )}
                <div className="flex items-center gap-2">
                  {active && (
                    <>
                      {isEdit ? (
                        <>
                          <Button variant="outline" size="sm" onClick={() => { setIsEdit(false); persist(); }}>
                            <Check className="mr-1 h-4 w-4" /> Done
                          </Button>
                          <Button variant="default" size="sm" onClick={persist}>
                            <Save className="mr-1 h-4 w-4" /> Save
                          </Button>
                        </>
                      ) : (
                        <Button variant="outline" size="sm" onClick={() => setIsEdit(true)}>
                          <Edit3 className="mr-1 h-4 w-4" /> Edit
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={remove} className="text-destructive hover:text-destructive">
                        <Trash2 className="mr-1 h-4 w-4" /> Delete
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="paper-content h-full flex flex-col">
              {!active ? (
                <div className="p-10 text-center text-muted-foreground">
                  Select a note or create a new one to begin.
                </div>
              ) : !('content' in active) ? (
                <div className="h-full p-4">
                  <div className="mb-4 flex items-center justify-between">
                    {isEdit ? (
                      <div className="flex items-center gap-2 w-full">
                        <Input
                          value={title}
                          onChange={e => setTitle(e.target.value)}
                          className="text-2xl font-bold border-none px-0 focus-visible:ring-0 flex-1"
                        />
                        <Button size="sm" onClick={() => { setIsEdit(false); persist(); }}>Done</Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 w-full group">
                        <h1 className="text-2xl font-bold">{title}</h1>
                        <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => setIsEdit(true)}>
                          <Edit3 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                  <BookView book={active as NotebookBook} onUpdateBook={(updated) => {
                    setActive(updated);
                    setBooks(prev => prev.map(b => b.id === updated.id ? updated : b));
                  }} />
                </div>
              ) : (
                <div className="p-3 sm:p-4 lg:p-8">
                  {isEdit ? (
                    <>
                      <Input
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        placeholder="Title"
                        className="mb-3 border-none bg-transparent text-2xl font-bold shadow-none focus-visible:ring-0"
                      />
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        {tags.map(t => (
                          <Badge key={t} variant="secondary" className="group">
                            {t}
                            <button className="ml-1 rounded-full p-0.5 opacity-70 group-hover:opacity-100" onClick={() => removeTag(t)} aria-label={`Remove ${t}`}>
                              ×
                            </button>
                          </Badge>
                        ))}
                        <div className="flex items-center gap-2">
                          <Tags className="h-4 w-4 text-muted-foreground" />
                          <Input
                            value={tagInput}
                            onChange={e => setTagInput(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTagFromInput(); } }}
                            placeholder="Add tag and press Enter"
                            className="h-8 w-full max-w-[260px] border-none bg-transparent shadow-none focus-visible:ring-0"
                          />
                        </div>
                      </div>

                      <div className="min-h-[55vh]">
                        <MarkdownEditor className="h-[55vh]" value={content} onChange={v => setContent(v || '')} />
                      </div>
                    </>
                  ) : (
                    <>
                      <h1 className="mb-2 px-1 text-2xl sm:text-3xl font-bold break-words">{title || 'Untitled Note'}</h1>
                      {tags.length > 0 && (
                        <div className="mb-4 flex flex-wrap items-center gap-2 px-1">
                          {tags.map(t => (<Badge key={t} variant="secondary">{t}</Badge>))}
                        </div>
                      )}
                      <div className="prose prose-sm sm:prose max-w-none px-1">
                        {editorType === 'math' ? (
                          <MarkdownMathjaxDisplay markdown={content || ''} className="w-full overflow-x-auto" markdownClassName="prose max-w-none" />
                        ) : (
                          <MarkdownDisplay markdown={content || ''} className="w-full overflow-x-auto" markdownClassName="prose max-w-none" />
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="md:hidden fixed bottom-6 right-6">
            <Button onClick={() => { setCreationType('note'); setIsCreationDialogOpen(true); }} className="h-12 w-12 rounded-full shadow-lg" size="icon"><Plus className="h-6 w-6" /></Button>
          </div>
        </section>
      </div>
    </div >
  );
}

