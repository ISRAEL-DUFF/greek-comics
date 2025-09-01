
'use client';

import { useEffect, useState, useTransition, useRef } from 'react';
import { type Note, updateNote } from '../actions';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { useDebounce } from 'use-debounce';
import { MarkdownEditor } from '@/components/markdown-editor';
import { Badge } from '@/components/ui/badge';
import { X, Edit, Save, Check, Loader2 } from 'lucide-react';
import { MarkdownDisplay } from '@/components/markdown-display';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface NoteEditorProps {
  note: Note | null;
  onNoteUpdated: (note: Note) => void;
}

export function NoteEditor({ note, onNoteUpdated }: NoteEditorProps) {
  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState(note?.content || '');
  const [tags, setTags] = useState<string[]>(note?.tags || []);
  const [tagInput, setTagInput] = useState('');
  
  const [isEditMode, setIsEditMode] = useState(false);
  
  const [isSaving, startSavingTransition] = useTransition();
  const { toast } = useToast();

  const [debouncedContent] = useDebounce(content, 1000);
  const [debouncedTitle] = useDebounce(title, 1000);
  const [debouncedTags] = useDebounce(tags, 1000);

  const prevNoteId = useRef(note?.id);
  
  // Effect to reset state when a new note is selected
  useEffect(() => {
    if (note) {
      if (note.id !== prevNoteId.current) {
        setTitle(note.title || '');
        setContent(note.content || '');
        setTags(note.tags || []);
        setIsEditMode(false); // Reset edit mode when note changes
        prevNoteId.current = note.id;
      }
    }
  }, [note]);
  
  const handleSaveChanges = (field?: 'title' | 'content' | 'tags') => {
    if (!note) return;
     startSavingTransition(() => {
        const updatedFields: Partial<Note> = {
          id: note.id,
          title: title,
          content: content,
          tags: tags,
        };

        updateNote(updatedFields).then(() => {
            const updatedNote: Note = { ...note, ...updatedFields };
            onNoteUpdated(updatedNote);
            if (field !== 'content') {
                toast({
                  title: (
                    <div className="flex items-center">
                      <Check className="mr-2 h-4 w-4 text-green-500" /> Saved
                    </div>
                  ),
                  duration: 2000,
                });
            }
        });
      });
  }

  // Effect to auto-save changes on debounced values
  useEffect(() => {
    if (note && isEditMode) {
        if (debouncedTitle !== note.title) {
            handleSaveChanges('title');
        }
    }
  }, [debouncedTitle, note, isEditMode]);
  
   useEffect(() => {
    if (note && isEditMode) {
        if (debouncedContent !== note.content) {
            handleSaveChanges('content');
        }
    }
  }, [debouncedContent, note, isEditMode]);
  
   useEffect(() => {
    if (note && isEditMode) {
        if (JSON.stringify(debouncedTags) !== JSON.stringify(note.tags)) {
            handleSaveChanges('tags');
        }
    }
  }, [debouncedTags, note, isEditMode]);


  const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value.includes(',')) {
      const newTags = e.target.value
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag && !tags.includes(tag));
      setTags([...tags, ...newTags]);
      setTagInput('');
    } else {
      setTagInput(e.target.value);
    }
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
        e.preventDefault();
        const newTag = tagInput.trim();
        if (!tags.includes(newTag)) {
            setTags([...tags, newTag]);
        }
        setTagInput('');
    } else if (e.key === 'Backspace' && !tagInput) {
        setTags(tags.slice(0, -1));
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  if (!note) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground p-4 text-center">
        <p>Select a note from the sidebar to view, or create a new one.</p>
      </div>
    );
  }

  return (
    <div className="p-1 md:p-4 h-full flex flex-col">
       <div className="flex items-center justify-between h-10 mb-2">
        <div className="flex items-center gap-2">
           {isSaving && (
            <div className="flex items-center text-xs text-muted-foreground">
                <Loader2 className="mr-1 h-3 w-3 animate-spin"/>
                Saving...
            </div>
           )}
        </div>
        <div className="flex items-center gap-2">
          {isEditMode ? (
            <Button variant="outline" onClick={() => setIsEditMode(false)}>
                <Check className="mr-2 h-4 w-4" />
                Done
              </Button>
          ) : (
            <Button variant="outline" onClick={() => setIsEditMode(true)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          )}
        </div>
      </div>
      
      { isEditMode ? (
        <>
          <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-2xl font-bold border-none shadow-none focus-visible:ring-0 h-auto p-0 mb-2"
              placeholder="Untitled Note"
          />

          <div className="mb-4 flex flex-wrap items-center gap-2">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                  <button
                      onClick={() => removeTag(tag)}
                      className="ml-1 rounded-full p-0.5 hover:bg-destructive/20"
                    >
                      <X className="h-3 w-3" />
                    </button>
                </Badge>
              ))}
              <Input
                value={tagInput}
                onChange={handleTagInputChange}
                onKeyDown={handleTagInputKeyDown}
                placeholder="Add tags..."
                className="flex-1 h-8 min-w-[150px] border-none shadow-none focus-visible:ring-0 p-0"
              />
          </div>
        </>
      ) : (
        <>
          <h1 className="text-3xl font-bold p-0 mb-2 break-words">{title}</h1>
          {tags.length > 0 && (
            <div className="mb-4 flex flex-wrap items-center gap-2">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </>
      )}


      <div className="flex-grow h-full min-h-0 overflow-hidden">
         {isEditMode ? (
            <MarkdownEditor className='h-full' value={content} onChange={(value) => setContent(value || '')} />
         ) : (
            <div className="p-1 h-full prose-sm prose-p:font-body max-w-none">
              <MarkdownDisplay markdown={content} className="w-[98%] overflow-x-auto" markdownClassName = "prose prose-sm prose-p:font-body prose-headings:font-headline max-w-none prose-table:border prose-th:border prose-td:border prose-td:p-2 prose-th:p-2 overflow-x-auto" />
            </div>
         )}
      </div>
    </div>
  );
}
