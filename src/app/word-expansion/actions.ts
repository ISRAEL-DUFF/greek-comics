
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
    language: string;
};

export type ExpandedWordListItem = Pick<ExpandedWord, 'id' | 'word'>;

type GenerateResult = {
    data?: ExpandedWord[];
    error?: string;
};

type UpdateResult = {
    data?: ExpandedWord;
    error?: string;
}

// Action to generate, save, and return a word expansion for one or more words.
export async function generateAndSaveWordExpansionAction(words: string): Promise<GenerateResult> {
  if (!words) {
    return { error: 'Word(s) cannot be empty.' };
  }

  if (!supabase) {
    return { error: 'Supabase is not configured. Cannot save word.' };
  }

  // Split the input string by commas, trim whitespace, and filter out empty strings.
  const wordList = words.split(',').map(w => w.trim().toLowerCase()).filter(Boolean);
  if (wordList.length === 0) {
    return { error: 'No valid words provided.' };
  }

  const generatedWords: ExpandedWord[] = [];

  try {
    for (const word of wordList) {
        // 1. Check if the word already exists in the database (case-insensitive)
        const { data: existingWord, error: fetchError } = await supabase
            .from(EXPANDED_WORDS_TABLE)
            .select('*')
            .eq('word', word)
            .eq('language', 'greek')
            .maybeSingle();

        if (fetchError) {
            console.error(`Error fetching word "${word}":`, fetchError);
            return { error: `Database fetch error for "${word}": ${fetchError.message}` };
        }
        
        // 2. If it exists, add it to the results and continue
        if (existingWord) {
            generatedWords.push(existingWord);
            continue;
        }

        // 3. If it doesn't exist, generate the expansion
        const { expansion } = await expandWord({ word });

        if (!expansion) {
            console.warn(`Failed to generate expansion for "${word}".`);
            continue;
        }
        
        // 4. Save the new expansion to Supabase
        const { data: newWord, error: insertError } = await supabase
            .from(EXPANDED_WORDS_TABLE)
            .insert({ word, expansion, language: 'greek' })
            .select()
            .single();

        if (insertError) {
            console.error(`Error saving expanded word "${word}":`, insertError);
            return { error: `Database insert error for "${word}": ${insertError.message}` };
        }
        
        if (newWord) {
            generatedWords.push(newWord);
        }
    }

    if (generatedWords.length === 0) {
      return { error: 'Could not find or generate an expansion for any of the provided words.' };
    }

    return { data: generatedWords };

  } catch (error: any) {
    console.error('Error in generateAndSaveWordExpansionAction:', error);
    return { error: 'An unexpected error occurred during word expansion.' };
  }
}


// Action to update an existing word expansion
export async function updateWordExpansionAction(id: number, newExpansion: string): Promise<UpdateResult> {
    if (!supabase) {
      return { error: 'Supabase is not configured. Cannot update word.' };
    }
  
    try {
      const { data, error } = await supabase
        .from(EXPANDED_WORDS_TABLE)
        .update({ expansion: newExpansion })
        .eq('id', id)
        .select()
        .single();
  
      if (error) {
        console.error('Error updating expanded word:', error);
        return { error: `Database error: ${error.message}` };
      }
  
      return { data };
  
    } catch (error: any) {
      console.error('Error in updateWordExpansionAction:', error);
      return { error: 'An unexpected error occurred while updating the word.' };
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
      .eq('language', 'greek')
      .not('word', 'eq', '') // Filter out rows where word is an empty string
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

// Action to search for words within the expansion content
export async function searchExpandedWordsAction(searchTerm: string): Promise<ExpandedWordListItem[]> {
  if (!supabase) {
    return [];
  }
  if (!searchTerm) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from(EXPANDED_WORDS_TABLE)
      .select('id, word')
      .eq('language', 'greek')
      .ilike('expansion', `%${searchTerm}%`) // Case-insensitive search
      .not('word', 'eq', '')
      .order('word', { ascending: true });

    if (error) {
      console.error('Error searching expanded words:', error);
      return [];
    }
    return data || [];
  } catch (error) {
    console.error('Error in searchExpandedWordsAction:', error);
    return [];
  }
}
