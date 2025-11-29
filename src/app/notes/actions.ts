
'use server';

import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

const NoteSchema = z.object({
  id: z.number().optional(),
  title: z.string().min(1, 'Title is required.'),
  content: z.string().optional(),
  tags: z.array(z.string()).optional(),
  is_pinned: z.boolean().optional(),
  folder_path: z.string().nullable().optional(),
  editor_type: z.string().optional(), // 'default' or 'math'
  notebook_book_id: z.number().nullable().optional(),
  page_order: z.number().nullable().optional(),
});

export type Note = {
  id: number;
  created_at: string;
  title: string;
  content: string | null;
  tags: string[];
  is_pinned: boolean;
  folder_path: string | null;
  editor_type: 'default' | 'math';
  notebook_book_id: number | null;
  page_order: number | null;
};

export type NotebookBook = {
  id: number;
  created_at: string;
  title: string;
  is_pinned: boolean;
};

const NOTES_TABLE = 'notes';
const NOTEBOOK_BOOKS_TABLE = 'notebook_books';

export async function getNotes(): Promise<Note[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from(NOTES_TABLE)
    .select('*')
    .is('notebook_book_id', null) // Only fetch top-level notes (not pages)
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching notes:', error.message);
    return [];
  }
  return (data as any[])?.map(n => ({
    ...n,
    editor_type: n.editor_type || 'default'
  })) || [];
}

export async function getNotebookBooks(): Promise<NotebookBook[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from(NOTEBOOK_BOOKS_TABLE)
    .select('*')
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching notebook books:', error.message);
    return [];
  }
  return data || [];
}

export async function getBookPages(bookId: number): Promise<Note[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from(NOTES_TABLE)
    .select('*')
    .eq('notebook_book_id', bookId)
    .order('page_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) {
    console.error(`Error fetching pages for book ${bookId}:`, error.message);
    return [];
  }
  return (data as any[])?.map(n => ({
    ...n,
    editor_type: n.editor_type || 'default'
  })) || [];
}

export async function getNoteById(id: number): Promise<Note | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from(NOTES_TABLE)
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error(`Error fetching note ${id}:`, error.message);
    return null;
  }
  return { ...data, editor_type: data.editor_type || 'default' };
}

export async function createNote(
  title: string,
  folderPath: string | null = null,
  editorType: 'default' | 'math' = 'default',
  notebookBookId: number | null = null
): Promise<Note | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from(NOTES_TABLE)
    .insert({
      title,
      content: '',
      tags: [],
      folder_path: folderPath,
      editor_type: editorType,
      notebook_book_id: notebookBookId
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating note:', error.message);
    return null;
  }

  revalidatePath('/notes');
  if (data?.id) {
    revalidatePath(`/notes/${data.id}`);
  }
  return { ...data, editor_type: data.editor_type || 'default' };
}

export async function createNotebookBook(title: string): Promise<NotebookBook | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from(NOTEBOOK_BOOKS_TABLE)
    .insert({ title })
    .select()
    .single();

  if (error) {
    console.error('Error creating notebook book:', error.message);
    return null;
  }
  revalidatePath('/notes');
  return data;
}

export async function updateNote(note: Partial<Note> & { id: number }) {
  if (!supabase) return;

  const { error } = await supabase
    .from(NOTES_TABLE)
    .update(note)
    .eq('id', note.id);

  if (error) {
    console.error('Error updating note:', error.message);
  }
  revalidatePath('/notes');
  revalidatePath(`/notes/${note.id}`);
}

export async function updateNotebookBook(book: Partial<NotebookBook> & { id: number }) {
  if (!supabase) return;

  const { error } = await supabase
    .from(NOTEBOOK_BOOKS_TABLE)
    .update(book)
    .eq('id', book.id);

  if (error) {
    console.error('Error updating notebook book:', error.message);
  }
  revalidatePath('/notes');
}

export async function deleteNote(id: number) {
  if (!supabase) return;

  const { error } = await supabase
    .from(NOTES_TABLE)
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting note:', error.message);
  }
  revalidatePath('/notes');
  revalidatePath(`/notes/${id}`);
}

export async function deleteNotebookBook(id: number) {
  if (!supabase) return;

  // First delete all pages associated with the book
  const { error: pagesError } = await supabase
    .from(NOTES_TABLE)
    .delete()
    .eq('notebook_book_id', id);

  if (pagesError) {
    console.error('Error deleting book pages:', pagesError.message);
    return;
  }

  const { error } = await supabase
    .from(NOTEBOOK_BOOKS_TABLE)
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting notebook book:', error.message);
  }
  revalidatePath('/notes');
}
