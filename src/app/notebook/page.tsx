
'use client';

import React, { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { getNotes, getNoteById, createNote, updateNote, deleteNote, type Note } from '@/app/notes/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { MarkdownEditor } from '@/components/markdown-editor';
import { MarkdownDisplay } from '@/components/markdown-display';
import { MarkdownMathjaxDisplay } from '@/components/markdown-mathjax-display';
import { cn } from '@/lib/utils';
import { Plus, Search, Edit3, Check, Trash2, Save, Loader2, Tags, MoreVertical, Folder as FolderIcon, FolderPlus, Sigma, Pilcrow } from 'lucide-react';
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


export default function NotebookPage() {
  const { toast } = useToast();

  const [notes, setNotes] = useState<Note[]>([]);
  const [filtered, setFiltered] = useState<Note[]>([]);
  const [active, setActive] = useState<Note | null>(null);
  const [openTabs, setOpenTabs] = useState<Note[]>([]);
  const [activeTabId, setActiveTabId] = useState<number | null>(null);
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
  const [editorType, setEditorType] = useState<'default' | 'math'>('default');
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
      const list = await getNotes();
      setNotes(list);
      setIsLoading(false);

      try {
        const idsRaw = localStorage.getItem(OPEN_TAB_IDS_LS_KEY);
        if (idsRaw) {
          const idsParsed = JSON.parse(idsRaw) as number[];
          if (Array.isArray(idsParsed) && idsParsed.length > 0) {
            const fetched = await Promise.all(idsParsed.map(id => getNoteById(id)));
            const tabs = fetched.filter((n): n is Note => !!n);
            if (tabs.length > 0) {
              setOpenTabs(tabs);
              const storedActive = Number(localStorage.getItem(ACTIVE_TAB_ID_LS_KEY) || '');
              const candidate = tabs.find(t => t.id === storedActive)?.id ?? tabs[tabs.length - 1].id;
              setActiveTabId(candidate);
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
    if (!q) {
      setFiltered(notes);
    } else {
      setFiltered(
        notes.filter(n =>
          (n.title || '').toLowerCase().includes(q) ||
          (n.content || '').toLowerCase().includes(q) ||
          (n.tags || []).some(t => (t || '').toLowerCase().includes(q))
        )
      );
    }
  }, [notes, query]);

  useEffect(() => {
    try {
      if (!restored) return;
      const ids = openTabs.map(t => t.id);
      localStorage.setItem(OPEN_TAB_IDS_LS_KEY, JSON.stringify(ids));
    } catch {}
  }, [openTabs, restored]);

  useEffect(() => {
    try {
      if (!restored) return;
      if (activeTabId != null) {
        localStorage.setItem(ACTIVE_TAB_ID_LS_KEY, String(activeTabId));
      } else {
        localStorage.removeItem(ACTIVE_TAB_ID_LS_KEY);
      }
    } catch {}
  }, [activeTabId, restored]);

  useEffect(() => {
    if (activeTabId == null) {
      setActive(null);
      return;
    }
    const n = openTabs.find(t => t.id === activeTabId) || null;
    setActive(n);
  }, [activeTabId, openTabs]);

  useEffect(() => {
    if (!active) return;
    if (prevId.current !== active.id) {
      setTitle(active.title || '');
      setContent(active.content || '');
      setTags(active.tags || []);
      setEditorType(active.editor_type || 'default');
      setIsEdit(false);
      prevId.current = active.id;
    }
  }, [active]);

  const addTabAndActivate = (note: Note) => {
    setOpenTabs(prev => (prev.some(p => p.id === note.id) ? prev : [...prev, note]));
    setActiveTabId(note.id);
  };

  const openNote = async (id: number) => {
    const exists = openTabs.find(t => t.id === id);
    if (exists) {
      setActiveTabId(id);
      setMobileView('page');
      return;
    }
    const full = await getNoteById(id);
    if (full) {
      addTabAndActivate(full);
      setMobileView('page');
    } else {
      toast({ variant: 'destructive', title: 'Failed to open note' });
    }
  };

  const createNew = async (editorType: 'default' | 'math' = 'default') => {
    const note = await createNote('Untitled Note', null, editorType);
    if (note) {
      setNotes(prev => [note, ...prev]);
      addTabAndActivate(note);
      setIsEdit(true);
      toast({ title: 'New note created' });
    } else {
      toast({ variant: 'destructive', title: 'Failed to create note' });
    }
  };

  const persist = async () => {
    if (!active) return;
    startSaving(async () => {
      const updatedNoteData: Partial<Note> = { id: active.id, title, content, tags, editor_type: editorType };
      await updateNote(updatedNoteData);
      const updated: Note = { ...active, ...updatedNoteData };
      
      setNotes(prev => prev.map(n => (n.id === updated.id ? updated : n)));
      setOpenTabs(prev => prev.map(t => (t.id === updated.id ? updated : t)));
      setActive(updated); // Also update the main active state

      toast({ title: 'Saved' });
    });
  };
  
  const handleEditorTypeChange = async (newType: 'default' | 'math') => {
    if (!active) return;
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
    await deleteNote(active.id);
    setNotes(prev => prev.filter(n => n.id !== active.id));
    closeTab(active.id, true);
    toast({ title: 'Note deleted' });
  };

  const addTagFromInput = () => {
    const t = tagInput.trim();
    if (!t) return;
    if (!tags.includes(t)) setTags(prev => [...prev, t]);
    setTagInput('');
  };

  const removeTag = (t: string) => setTags(prev => prev.filter(x => x !== t));

  const closeTab = (id: number, isDeletion = false) => {
    setOpenTabs(prev => {
      const idx = prev.findIndex(p => p.id === id);
      if (idx === -1) return prev;
      const newTabs = prev.filter(p => p.id !== id);
      if (activeTabId === id) {
        let next: number | null = null;
        if (newTabs.length > 0) {
          next = (newTabs[idx] || newTabs[idx - 1] || newTabs[newTabs.length - 1]).id;
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

  const visibleNotes: Note[] = React.useMemo(() => {
    const base = filtered;
    if (selectedFolder === 'all') return base;
    if (selectedFolder === 'unfiled') return base.filter(n => !n.folder_path);
    return base.filter(n => n.folder_path === selectedFolder);
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
      {Object.values(nodes).sort((a,b) => a.name.localeCompare(b.name)).map(node => (
        <AccordionItem value={node.path} key={node.path}>
          <AccordionTrigger>
            <button
              type="button"
              className={cn('flex items-center gap-2 text-left', selectedFolder === node.path && 'text-primary')}
              onClick={(e) => { e.stopPropagation(); setSelectedFolder(node.path); }}
            >
              <FolderIcon className="h-4 w-4" />
              <span className="truncate">{node.name}</span>
            </button>
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
            <Button className="gap-2" onClick={() => createNew()}><Plus className="h-4 w-4" /> New</Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon" aria-label="New Folder">
                  <FolderPlus className="h-4 w-4"/>
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
                <button
                  key={n.id}
                  onClick={() => openNote(n.id)}
                  className={cn(
                    'w-full rounded-md border p-3 text-left transition-colors hover:bg-amber-50',
                    active?.id === n.id ? 'bg-amber-50 border-amber-300' : 'bg-white border-slate-200'
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="sticky-label inline-block rounded px-2 py-1 text-sm font-medium max-w-[75%] truncate">{n.title || 'Untitled Note'}</div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                          <MoreVertical className="h-4 w-4"/>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
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
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation(); setActiveTabId(n.id); remove(); }}>
                          <Trash2 className="mr-2 h-4 w-4"/> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  {n.tags?.length ? (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {n.tags.slice(0, 4).map(t => (
                        <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
                      ))}
                      {n.tags.length > 4 && (<Badge variant="outline" className="text-xs">+{n.tags.length - 4}</Badge>)}
                    </div>
                  ) : null}
                </button>
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
                {isSaving && (<span className="inline-flex items-center text-xs text-muted-foreground"><Loader2 className="mr-1 h-3 w-3 animate-spin"/>Saving</span>)}
                <div className="flex items-center gap-2 pl-1">
                  <Switch id="lines-toggle" checked={showLines} onCheckedChange={setShowLines} />
                  <Label htmlFor="lines-toggle" className="text-xs md:text-sm text-muted-foreground">Lines</Label>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {active && (
                  <>
                    {isEdit ? (
                      <>
                        <Button variant="outline" size="sm" onClick={() => { setIsEdit(false); persist(); }}>
                          <Check className="mr-1 h-4 w-4"/> Done
                        </Button>
                        <Button variant="default" size="sm" onClick={persist}>
                          <Save className="mr-1 h-4 w-4"/> Save
                        </Button>
                      </>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => setIsEdit(true)}>
                        <Edit3 className="mr-1 h-4 w-4"/> Edit
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={remove} className="text-destructive hover:text-destructive">
                      <Trash2 className="mr-1 h-4 w-4"/> Delete
                    </Button>
                  </>
                )}
              </div>
            </div>

            <div className="paper-content">
              {!active ? (
                <div className="p-10 text-center text-muted-foreground">
                  Select a note or create a new one to begin.
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
                          <Tags className="h-4 w-4 text-muted-foreground"/>
                          <Input
                            value={tagInput}
                            onChange={e => setTagInput(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTagFromInput(); } }}
                            placeholder="Add tag and press Enter"
                            className="h-8 w-full max-w-[260px] border-none bg-transparent shadow-none focus-visible:ring-0"
                          />
                        </div>
                      </div>
                       <div className="flex items-center space-x-2 my-4">
                        <Label htmlFor="editor-type-switch" className="text-xs text-muted-foreground">Editor Type:</Label>
                        <Switch id="editor-type-switch"
                            checked={editorType === 'math'}
                            onCheckedChange={(checked) => handleEditorTypeChange(checked ? 'math' : 'default')}
                        />
                         <Label htmlFor="editor-type-switch" className="flex items-center gap-1 text-xs">
                           {editorType === 'default' ? <Pilcrow className="h-4 w-4" /> : <Sigma className="h-4 w-4" />}
                           {editorType === 'math' ? 'Math / LaTeX' : 'Standard'}
                         </Label>
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
                            <MarkdownMathjaxDisplay markdown={content || ''} />
                        ) : (
                            <MarkdownDisplay markdown={content || ''} className="w-full overflow-x-auto" markdownClassName="prose max-w-none"/>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="md:hidden fixed bottom-6 right-6">
            <Button onClick={() => createNew()} className="h-12 w-12 rounded-full shadow-lg" size="icon"><Plus className="h-6 w-6" /></Button>
          </div>
        </section>
      </div>
    </div>
  );
}
