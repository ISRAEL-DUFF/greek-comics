'use server';

import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { expandWord } from '@/ai/flows/expand-word-flow';

const EXPANDED_WORDS_TABLE = 'expanded_words';

export type ExpandedWord = {
    id: number;
    created_at: string;
    word: string;
    expansion: string; // Markdown content
};

export type ExpandedWordListItem = Pick<ExpandedWord, 'id' | 'word'>;

type GenerateResult = {
    data?: ExpandedWord;
    error?: string;
};

// Action to generate, save, and return a word expansion
export async function generateAndSaveWordExpansionAction(word: string): Promise<GenerateResult> {
  if (!word) {
    return { error: 'Word cannot be empty.' };
  }

  if (!supabase) {
    return { error: 'Supabase is not configured. Cannot save word.' };
  }

  try {
    // 1. Generate the expansion
    const { expansion } = await expandWord({ word });

    if (!expansion) {
      return { error: 'Failed to generate expansion from AI.' };
    }
    
    // 2. Save to Supabase
    const { data, error } = await supabase
      .from(EXPANDED_WORDS_TABLE)
      .insert({ word: word.toLowerCase(), expansion })
      .select()
      .single();

    if (error) {
      console.error('Error saving expanded word:', error);
      return { error: `Database error: ${error.message}` };
    }

    return { data };

  } catch (error) {
    console.error('Error in generateAndSaveWordExpansionAction:', error);
    return { error: 'An unexpected error occurred during word expansion.' };
  }
}

// Action to get the list of all expanded words
export async function getExpandedWordsAction(): Promise<ExpandedWordListItem[]> {
  if (!supabase) {
    return [];
  }
  try {
    const { data, error } = await supabase
      .from(EXPANDED_WORDS_TABLE)
      .select('id, word')
      .order('word', { ascending: true });

    if (error) {
      console.error('Error fetching expanded words list:', error);
      return [];
    }
    return data || [];
  } catch (error) {
    console.error('Error in getExpandedWordsAction:', error);
    return [];
  }
}

// Action to get a single expanded word by ID
export async function getExpandedWordByIdAction(id: number): Promise<ExpandedWord | null> {
    if (!supabase) {
      return null;
    }
    try {
      const { data, error } = await supabase
        .from(EXPANDED_WORDS_TABLE)
        .select('*')
        .eq('id', id)
        .single();
  
      if (error) {
        console.error(`Error fetching expanded word with id ${id}:`, error);
        return null;
      }
      return data;
    } catch (error) {
      console.error(`Error in getExpandedWordByIdAction for id ${id}:`, error);
      return null;
    }
  }
