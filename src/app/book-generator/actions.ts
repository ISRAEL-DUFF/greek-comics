
'use server';

import { z } from 'zod';
import { generateGreekBook, generateBookCover, type GenerateGreekBookOutput } from '@/ai/flows/generate-greek-book-flow';
import { generateFootnoteIllustration as generateFootnoteIllustrationFlow } from '@/ai/flows/generate-footnote-illustration';
import { BookFormSchema } from './schema';
import { ai } from '@/ai/genkit';

export type BookData = GenerateGreekBookOutput & {
    coverIllustrationUri: string;
    topic: string;
    level: string;
    grammarScope: string;
};

export type BookResult = {
  data?: BookData;
  error?: string;
  fieldErrors?: { [key: string]: string[] | undefined };
};

export type GenerateImageResult = {
    data?: {
        illustrationUri: string;
    };
    error?: string;
}

// Supabase integration for saving books
import { supabase } from '@/lib/supabase';

const BOOKS_TABLE = 'books';

export type SavedBook = {
  id: number;
  created_at: string;
  title: string;
  author: string;
  pages: BookData['pages'];
  coverIllustrationUri: string;
  topic: string;
  level: string;
  grammarScope: string;
};

export type SavedBookListItem = Pick<SavedBook, 'id' | 'created_at' | 'title' | 'topic' | 'level'>;

export type SaveBookResult = { success?: boolean; error?: string };

export async function saveBookAction(book: BookData): Promise<SaveBookResult> {
  if (!supabase) {
    return { error: 'Supabase is not configured. Cannot save book.' };
  }
  if (!book || !book.title || !book.pages || !book.coverIllustrationUri) {
    return { error: 'Invalid book data provided.' };
  }

  try {
    const { error } = await supabase
      .from(BOOKS_TABLE)
      .insert([
        {
          title: book.title,
          author: book.author,
          pages: book.pages,
          coverIllustrationUri: book.coverIllustrationUri,
          topic: book.topic,
          level: book.level,
          grammarScope: book.grammarScope,
        },
      ]);
    if (error) {
      console.error('Error saving book:', error);
      return { error: `Failed to save book: ${error.message}` };
    }
    return { success: true };
  } catch (e) {
    console.error('Unexpected error saving book:', e);
    return { error: 'Unexpected error saving book.' };
  }
}

export async function getSavedBooksAction(): Promise<SavedBookListItem[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from(BOOKS_TABLE)
      .select('id, created_at, title, topic, level')
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Error fetching saved books:', error);
      return [];
    }
    return data || [];
  } catch (e) {
    console.error('Unexpected error fetching saved books:', e);
    return [];
  }
}

export async function getBookByIdAction(id: number): Promise<BookData | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from(BOOKS_TABLE)
      .select('*')
      .eq('id', id)
      .single();
    if (error) {
      console.error('Error fetching book by id:', error);
      return null;
    }
    if (!data) return null;
    const book: BookData = {
      title: data.title,
      author: data.author,
      pages: data.pages,
      coverIllustrationUri: data.coverIllustrationUri,
      topic: data.topic,
      level: data.level,
      grammarScope: data.grammarScope,
    };
    return book;
  } catch (e) {
    console.error('Unexpected error fetching book by id:', e);
    return null;
  }
}


export async function generateBookAction(
  formData: FormData
): Promise<BookResult> {
  const validatedFields = BookFormSchema.safeParse({
    level: formData.get('level'),
    topic: formData.get('topic'),
    grammarScope: formData.get('grammarScope'),
    numPages: formData.get('numPages'),
  });

  if (!validatedFields.success) {
    return {
      error: "Invalid form data. Please check the fields and try again.",
      fieldErrors: validatedFields.error.flatten().fieldErrors,
    };
  }
  
  try {
    const bookPromise = generateGreekBook(validatedFields.data);
    const coverPromise = generateBookCover(validatedFields.data.topic, validatedFields.data.topic);

    const [bookContent, coverImage] = await Promise.all([bookPromise, coverPromise]);

    if (!bookContent || !bookContent.pages || bookContent.pages.length === 0) {
      return { error: 'Generated book was empty or invalid.' };
    }
    if(!coverImage.coverIllustrationUri) {
        return { error: 'Could not generate a book cover.' };
    }

    return { 
      data: {
        ...bookContent,
        coverIllustrationUri: coverImage.coverIllustrationUri,
        topic: validatedFields.data.topic,
        level: validatedFields.data.level,
        grammarScope: validatedFields.data.grammarScope,
      }
    };

  } catch (error) {
    console.error("Error in generateBookAction:", error);
    return { error: 'An unexpected error occurred while generating the book. The AI service may be temporarily unavailable. Please try again later.' };
  }
}

export async function generateFootnoteIllustrationAction(prompt: string): Promise<GenerateImageResult> {
    if (!prompt) {
        return { error: 'Prompt cannot be empty.' };
    }
    try {
        const result = await generateFootnoteIllustrationFlow({ prompt });
        return { data: { illustrationUri: result.illustrationUri } };
    } catch (error) {
        console.error("Error in generateFootnoteIllustrationAction:", error);
        return { error: 'Failed to generate illustration.' };
    }
}


export async function generateMainIllustrationAction(prompt: string): Promise<GenerateImageResult> {
    if (!prompt) {
        return { error: 'Prompt cannot be empty.' };
    }
    try {
        const fullPrompt = `A full color, detailed illustration for a story about Ancient Greece. Do not include any text. The scene to illustrate is: ${prompt}.`;
        const {media} = await ai.generate({
            model: 'googleai/gemini-2.0-flash-preview-image-generation',
            prompt: [{ text: fullPrompt }],
            config: {
                responseModalities: ['TEXT', 'IMAGE'],
            },
        });
        
        if (!media || !media.url) {
            throw new Error('No image was generated for the page.');
        }

        return { data: { illustrationUri: media.url } };
    } catch (error) {
        console.error("Error in generateMainIllustrationAction:", error);
        return { error: 'Failed to generate illustration.' };
    }
}
