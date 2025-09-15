
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
    lemma?: string;
    tags?: string[] | null;
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

async function searchExistingForm(word: string): Promise<{data?: ExpandedWord, error?: any}> {
  if (!supabase) {
    return { error: Error('No supabase found')};
  }
  if (!word) {
    return { error: Error('Word cannot be empty')};
  }

  try {
    const { data, error } = await supabase
      .from(EXPANDED_WORDS_TABLE)
      .select('*')
      .eq('language', 'greek')
      .ilike('expansion', `%${word}%`) // Case-insensitive search
      .not('word', 'eq', '')
      .order('word', { ascending: true });

    if (error) {
      console.error('Error searching expanded words:', error);
      return { error };;
    }

    let listOfWords: typeof data = []

    for(const d of data) {
      const etymologyRegex = /\*\*(?:\d+\.\s*Etymology:|Etymology:)\*\*/
      const etymologyRegex1 = /\*\*(\d+\.\s*)?Etymology\*\*:/i;
      const etymologyRegex2 = /\*\*\d+\.\s*Etymology:\*\*/
      const etymologyRegex3 = /(\d+\.\s*)?\*{0,2}Etymology\*{0,2}\s*:?\s*/i
      const etymologyRegex4 = /^\d+\.\s+\*\*Etymology\*\*:/m

      let relevantPart = '';
      const relevantPart0 = d.expansion.split(etymologyRegex);
      const relevantPart1 = d.expansion.split(etymologyRegex1);
      const relevantPart2 = d.expansion.split(etymologyRegex2);
      const relevantPart3 = d.expansion.split(etymologyRegex3);
      const relevantPart4 = d.expansion.split(etymologyRegex4);

      if(relevantPart0.length > 1) {
        relevantPart = relevantPart0[0];
      } else if(relevantPart1.length > 1) {
        relevantPart = relevantPart1[0];
      } else if(relevantPart2.length > 1) {
        relevantPart = relevantPart2[0];
      } else if(relevantPart3.length > 1) {
        relevantPart = relevantPart3[0];
      } else if(relevantPart4.length > 1) {
        relevantPart = relevantPart4[0];
      }

      // const relevantPart = d.expansion.split(etymologyRegex)[0];
      const regex = new RegExp(`(^|[^\\p{L}])(${word})(?=[^\\p{L}]|$)`, 'u')

      // console.log({
      //   length: relevantPart.length,
      //   relevantPart: relevantPart.substr(relevantPart.length - 800, relevantPart.length)
      // })

      if(regex.test(relevantPart)) {
        return { data: d }
      }
    }

    return {}
  } catch (error) {
    console.error('Error in searchExpandedWordsAction:', error);
    return { error };
  }
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
          const { data: existingWord, error: fetchError } = await searchExistingForm(word)

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
        const { expansion, lemma } = await expandWord({ word });

        if (!expansion) {
            console.warn(`Failed to generate expansion for "${word}".`);
            continue;
        }
        
        // 4. Save the new expansion to Supabase
        const { data: newWord, error: insertError } = await supabase
            .from(EXPANDED_WORDS_TABLE)
            // Note: expects a 'tags' text[] column to exist. If absent, omit or add via DB migration.
            .insert({ word, expansion, lemma, language: 'greek' })
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
      .select('id, word, lemma')
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

// Tags: list distinct tag names across all words
export async function getAllTagsAction(): Promise<string[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from(EXPANDED_WORDS_TABLE)
      .select('tags')
      .eq('language', 'greek');
    if (error) {
      console.error('Error fetching tags:', error);
      return [];
    }
    const set = new Set<string>();
    for (const row of data || []) {
      const tags = (row as any).tags as string[] | null | undefined;
      if (Array.isArray(tags)) {
        for (const t of tags) {
          const name = (t ?? '').trim();
          if (name) set.add(name);
        }
      }
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  } catch (e) {
    console.error('Unexpected error in getAllTagsAction:', e);
    return [];
  }
}

// Add a single tag to a word (idempotent)
export async function addTagToWordAction(id: number, tag: string): Promise<{ data?: ExpandedWord; error?: string }>{
  if (!supabase) return { error: 'Supabase is not configured.' };
  const clean = (tag ?? '').trim();
  if (!clean) return { error: 'Tag cannot be empty.' };
  try {
    // Fetch current tags
    const { data: row, error: fetchErr } = await supabase
      .from(EXPANDED_WORDS_TABLE)
      .select('id, tags')
      .eq('id', id)
      .single();
    if (fetchErr) {
      console.error('Error fetching word for tagging:', fetchErr);
      return { error: `Fetch error: ${fetchErr.message}` };
    }
    const current = ((row as any)?.tags ?? []) as string[];
    const next = Array.from(new Set([...(current || []), clean]));
    const { data, error } = await supabase
      .from(EXPANDED_WORDS_TABLE)
      .update({ tags: next })
      .eq('id', id)
      .select()
      .single();
    if (error) {
      console.error('Error adding tag:', error);
      return { error: `Update error: ${error.message}` };
    }
    return { data: data as unknown as ExpandedWord };
  } catch (e: any) {
    console.error('Unexpected error in addTagToWordAction:', e);
    return { error: 'Unexpected error adding tag.' };
  }
}

// Remove a single tag from a word
export async function removeTagFromWordAction(id: number, tag: string): Promise<{ data?: ExpandedWord; error?: string }>{
  if (!supabase) return { error: 'Supabase is not configured.' };
  const clean = (tag ?? '').trim();
  if (!clean) return { error: 'Tag cannot be empty.' };
  try {
    const { data: row, error: fetchErr } = await supabase
      .from(EXPANDED_WORDS_TABLE)
      .select('id, tags')
      .eq('id', id)
      .single();
    if (fetchErr) {
      console.error('Error fetching word for untagging:', fetchErr);
      return { error: `Fetch error: ${fetchErr.message}` };
    }
    const current = ((row as any)?.tags ?? []) as string[];
    const next = (current || []).filter(t => t !== clean);
    const { data, error } = await supabase
      .from(EXPANDED_WORDS_TABLE)
      .update({ tags: next })
      .eq('id', id)
      .select()
      .single();
    if (error) {
      console.error('Error removing tag:', error);
      return { error: `Update error: ${error.message}` };
    }
    return { data: data as unknown as ExpandedWord };
  } catch (e: any) {
    console.error('Unexpected error in removeTagFromWordAction:', e);
    return { error: 'Unexpected error removing tag.' };
  }
}

// Bulk add a tag to multiple word IDs
export async function addTagToWordsBulkAction(ids: number[], tag: string): Promise<{ updated: number; error?: string }>{
  if (!supabase) return { updated: 0, error: 'Supabase is not configured.' };
  const clean = (tag ?? '').trim();
  if (!clean) return { updated: 0, error: 'Tag cannot be empty.' };
  if (!ids || ids.length === 0) return { updated: 0 };
  try {
    let updated = 0;
    for (const id of ids) {
      const res = await addTagToWordAction(id, clean);
      if (!res.error) updated += 1;
    }
    return { updated };
  } catch (e: any) {
    console.error('Unexpected error in addTagToWordsBulkAction:', e);
    return { updated: 0, error: 'Unexpected error during bulk tagging.' };
  }
}

// Get all words that contain the given tag
export async function getWordsByTagAction(tag: string): Promise<ExpandedWord[]> {
  if (!supabase) return [];
  const clean = (tag ?? '').trim();
  if (!clean) return [];
  try {
    // Primary strategy: array/jsonb contains
    let query = supabase
      .from(EXPANDED_WORDS_TABLE)
      .select('*')
      .eq('language', 'greek')
      .contains('tags', [clean]);

    let { data, error } = await query;
    if (error) {
      console.error('Error fetching words by tag (contains):', error);
      data = null;
    }

    // Fallback: fetch all with non-null tags and filter client-side
    if (!data || data.length === 0) {
      const { data: all, error: allErr } = await supabase
        .from(EXPANDED_WORDS_TABLE)
        .select('*')
        .eq('language', 'greek')
        .not('tags', 'is', null);
      if (allErr) {
        console.error('Error in fallback tag fetch:', allErr);
        return [];
      }
      const filtered = (all as any[]).filter(r => Array.isArray(r.tags) && r.tags.includes(clean));
      return filtered as unknown as ExpandedWord[];
    }

    return (data as unknown as ExpandedWord[]) || [];
  } catch (e) {
    console.error('Unexpected error in getWordsByTagAction:', e);
    return [];
  }
}
