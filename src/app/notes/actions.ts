
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
};

const NOTES_TABLE = 'notes';

export async function getNotes(): Promise<Note[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from(NOTES_TABLE)
    .select('*')
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching notes:', error.message);
    return [];
  }
  return data || [];
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
    return data;
}

export async function createNote(
  title: string, 
  folderPath: string | null = null,
  editorType: 'default' | 'math' = 'default'
): Promise<Note | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from(NOTES_TABLE)
    .insert({ title, content: '', tags: [], folder_path: folderPath, editor_type: editorType })
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
