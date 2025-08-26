
'use server';

import { z } from 'zod';
import { generateGreekBook, generateBookCover, type GenerateGreekBookOutput } from '@/ai/flows/generate-greek-book-flow';
import { BookFormSchema } from './components/book-generator-form';

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
