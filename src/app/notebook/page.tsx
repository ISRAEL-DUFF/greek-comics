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
import { cn } from '@/lib/utils';
import { Plus, Search, Edit3, Check, Trash2, Save, Loader2, Tags } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import './notebook.css';

export default function NotebookPage() {
  const { toast } = useToast();

  const [notes, setNotes] = useState<Note[]>([]);
  const [filtered, setFiltered] = useState<Note[]>([]);
  const [active, setActive] = useState<Note | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, startSaving] = useTransition();
  const [query, setQuery] = useState('');
  const [isEdit, setIsEdit] = useState(false);
  const [showLines, setShowLines] = useState(false); // off by default
  // Mobile view state: 'list' or 'page'
  const [mobileView, setMobileView] = useState<'list' | 'page'>('list');
  const [isDesktop, setIsDesktop] = useState(false);

  // Editable fields
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  const prevId = useRef<number | undefined>(undefined);

  useEffect(() => {
    // Track viewport to decide desktop vs mobile behavior
    const mq = typeof window !== 'undefined' ? window.matchMedia('(min-width: 768px)') : null;
    const handle = () => setIsDesktop(!!mq?.matches);
    handle();
    mq?.addEventListener('change', handle);

    (async () => {
      setIsLoading(true);
      const list = await getNotes();
      setNotes(list);
      setIsLoading(false);

      // On desktop, auto-open the most recent note; on mobile, stay in list view
      if (list.length > 0 && (mq?.matches ?? false)) {
        const full = await getNoteById(list[0].id);
        if (full) {
          setActive(full);
          setMobileView('page');
        }
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

  // Load editor state on active change
  useEffect(() => {
    if (!active) return;
    if (prevId.current !== active.id) {
      setTitle(active.title || '');
      setContent(active.content || '');
      setTags(active.tags || []);
      setIsEdit(false);
      prevId.current = active.id;
    }
  }, [active]);

  const openNote = async (id: number) => {
    const full = await getNoteById(id);
    if (full) {
      setActive(full);
      setMobileView('page');
    } else {
      toast({ variant: 'destructive', title: 'Failed to open note' });
    }
  };

  const createNew = async () => {
    const note = await createNote('Untitled Note');
    if (note) {
      setNotes(prev => [note, ...prev]);
      setActive(note);
      setIsEdit(true);
      toast({ title: 'New note created' });
    } else {
      toast({ variant: 'destructive', title: 'Failed to create note' });
    }
  };

  const persist = async () => {
    if (!active) return;
    startSaving(async () => {
      await updateNote({ id: active.id, title, content, tags });
      const updated: Note = { ...active, title, content, tags };
      setActive(updated);
      setNotes(prev => prev.map(n => (n.id === updated.id ? updated : n)));
      toast({ title: 'Saved' });
    });
  };

  const remove = async () => {
    if (!active) return;
    await deleteNote(active.id);
    setNotes(prev => prev.filter(n => n.id !== active.id));
    setActive(null);
    toast({ title: 'Note deleted' });
  };

  const addTagFromInput = () => {
    const t = tagInput.trim();
    if (!t) return;
    if (!tags.includes(t)) setTags(prev => [...prev, t]);
    setTagInput('');
  };

  const removeTag = (t: string) => setTags(prev => prev.filter(x => x !== t));

  return (
    <div className={cn('notebook-root flex min-h-[calc(100vh-56px)] w-full bg-slate-50 text-foreground')}> 
      {/* Spiral gutter only on desktop */}
      <div className="notebook-gutter hidden md:block" />

      {/* Mobile-first stacked layout */}
      <div className="flex w-full flex-col md:flex-row">
        {/* List panel */}
        <aside
          className={cn(
            'border-b bg-white/70 backdrop-blur-sm md:border-b-0 md:border-r',
            mobileView === 'list' ? 'block' : 'hidden',
            'md:block md:w-80'
          )}
        >
          <div className="flex items-center gap-2 p-3 border-b">
            <Button onClick={createNew} className="gap-2">
              <Plus className="h-4 w-4" /> New
            </Button>
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search notes..." className="pl-8" />
            </div>
          </div>

          <ScrollArea className="soft-scrollbars h-[calc(100svh-56px-49px)] md:h-[calc(100vh-56px-49px)]">
            <div className="p-2 space-y-2">
              {isLoading && (
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-16 animate-pulse rounded-md bg-slate-100" />
                ))
              )}
              {!isLoading && filtered.length === 0 && (
                <div className="text-sm text-muted-foreground p-4 text-center">No notes found</div>
              )}
              {!isLoading && filtered.map(n => (
                <button
                  key={n.id}
                  onClick={() => openNote(n.id)}
                  className={cn(
                    'w-full rounded-md border p-3 text-left transition-colors hover:bg-amber-50',
                    active?.id === n.id ? 'bg-amber-50 border-amber-300' : 'bg-white border-slate-200'
                  )}
                >
                  <div className="sticky-label inline-block rounded px-2 py-1 text-sm font-medium">{n.title || 'Untitled Note'}</div>
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

        {/* Paper page */}
        <section
          className={cn(
            'flex-1 py-4 px-3 md:py-6 md:px-8 lg:px-12',
            mobileView === 'page' ? 'block' : 'hidden',
            'md:block'
          )}
        >
          <div className={cn('paper rounded-xl overflow-hidden', showLines && 'lined')}>
            {/* Toolbar with back button on mobile */}
            <div className="flex items-center justify-between gap-2 border-b bg-white/70 px-2 py-2 backdrop-blur-sm md:px-4">
              <div className="flex items-center gap-3">
                {!isDesktop && (
                  <Button variant="ghost" size="sm" onClick={() => setMobileView('list')}>
                    ← Back
                  </Button>
                )}
                {isSaving && (<span className="inline-flex items-center text-xs text-muted-foreground"><Loader2 className="mr-1 h-3 w-3 animate-spin"/>Saving</span>)}
                {/* Lines toggle */}
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
                        <Button variant="outline" size="sm" onClick={() => setIsEdit(false)}>
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

            {/* Lined paper content */}
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
                        <MarkdownDisplay markdown={content} className="w-full overflow-x-auto" markdownClassName="prose max-w-none"/>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Mobile floating action button for new note */}
          <div className="md:hidden fixed bottom-6 right-6">
            <Button onClick={createNew} className="h-12 w-12 rounded-full shadow-lg" size="icon">
              <Plus className="h-6 w-6" />
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
