
'use client';

import { useEffect, useState, useTransition } from 'react';
import { type Note, updateNote } from '../actions';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { useDebounce } from 'use-debounce';
import { MarkdownEditor } from '@/components/markdown-editor';
import { Badge } from '@/components/ui/badge';
import { X, Edit, Save } from 'lucide-react';
import { MarkdownDisplay } from '@/components/markdown-display';
import { Button } from '@/components/ui/button';

interface NoteEditorProps {
  note: Note | null;
  isLoading: boolean;
}

export function NoteEditor({ note, isLoading }: NoteEditorProps) {
  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState(note?.content || '');
  const [tags, setTags] = useState<string[]>(note?.tags || []);
  const [tagInput, setTagInput] = useState('');
  
  const [isEditMode, setIsEditMode] = useState(false);

  const [isSaving, startSavingTransition] = useTransition();

  const [debouncedContent] = useDebounce(content, 500);
  const [debouncedTitle] = useDebounce(title, 500);
  const [debouncedTags] = useDebounce(tags, 500);
  
  // Effect to reset state when a new note is selected
  useEffect(() => {
    if (note) {
      setTitle(note.title || '');
      setContent(note.content || '');
      setTags(note.tags || []);
      // When a new note is selected, exit edit mode
      // setIsEditMode(false); 
    }
  }, [note]);
  
  const handleAutoSaveChanges = () => {
    if (!note) return;
     startSavingTransition(() => {
        updateNote({
          id: note.id,
          title: title,
          content: content,
          tags: tags,
        }).then(() => {
          setIsEditMode(true);
        });
      });
  }

  // Effect to auto-save changes on debounced values
  useEffect(() => {
    if (
      note &&
      isEditMode &&
      (debouncedContent !== note.content ||
        debouncedTitle !== note.title ||
        JSON.stringify(debouncedTags) !== JSON.stringify(note.tags))
    ) {
      handleAutoSaveChanges();
      console.log('Auto saving...')
    }
  }, [debouncedContent, debouncedTitle, debouncedTags, note, isEditMode]);

  const handleSaveChanges = () => {
    if (!note) return;
     startSavingTransition(() => {
        updateNote({
          id: note.id,
          title: title,
          content: content,
          tags: tags,
        });
        setIsEditMode(false);
      });
  }

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


  if (isLoading) {
    return (
      <div className="p-8 space-y-4">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    );
  }

  if (!note) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <p>Select a note to view or create a new one.</p>
      </div>
    );
  }

  return (
    <div className="p-1 md:p-4 h-full flex flex-col">
       <div className="flex items-center justify-between h-10 mb-2">
        <div className="flex items-center gap-2">
           {isSaving && <p className="text-xs text-muted-foreground">Saving...</p>}
        </div>
        <div className="flex items-center gap-2">
          {isEditMode ? (
            <>
              <Button variant="ghost" onClick={() => {
                setIsEditMode(false);
                // Reset state to original note state on cancel
                setTitle(note.title);
                setContent(note.content || '');
                setTags(note.tags || []);
              }}>Cancel</Button>
              <Button onClick={handleSaveChanges} disabled={isSaving}>
                <Save className="mr-2 h-4 w-4" />
                Save & Exit
              </Button>
            </>
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
                placeholder="Add tags (comma-separated)..."
                className="flex-1 h-8 min-w-[150px] border-none shadow-none focus-visible:ring-0 p-0"
              />
          </div>
        </>
      ) : (
        <>
          <h1 className="text-3xl font-bold p-0 mb-2">{title}</h1>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        </>
      )}


      <div className="flex-grow h-full min-h-0 md:w-[82vw] overflow-x-auto">
         {isEditMode ? (
            <MarkdownEditor className='w-[82vw] overflow-x-auto' value={content} onChange={(value) => setContent(value || '')} />
         ) : (
            <div className="p-1 h-full prose-sm prose-p:font-body max-w-none">
              <MarkdownDisplay markdown={content} className="w-[82vw] overflow-x-auto" markdownClassName = "prose prose-sm prose-p:font-body prose-headings:font-headline max-w-none prose-table:border prose-th:border prose-td:border prose-td:p-2 prose-th:p-2 overflow-x-auto" />
            </div>
         )}
      </div>
    </div>
  );
}
