'use server';

/**
 * @fileOverview Provides glosses for all unique words in a given story.
 *
 * - glossStory - A function that returns a map of words to their definitions.
 * - GlossStoryInput - The input type for the glossStory function.
 * - GlossStoryOutput - The return type for the glossStory function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { GlossWordOutputSchema, GlossStoryOutputSchema } from '@/lib/schemas';
import { glossWord } from './gloss-word';

const GlossStoryInputSchema = z.object({
  sentences: z.array(z.object({
    sentence: z.string(),
    words: z.array(z.object({
      word: z.string(),
      syntaxNote: z.string(),
    })),
  })).describe('The structured story with sentences and words.'),
});

export type GlossStoryInput = z.infer<typeof GlossStoryInputSchema>;
export type GlossStoryOutput = z.infer<typeof GlossStoryOutputSchema>;

export async function glossStory(input: GlossStoryInput): Promise<GlossStoryOutput> {
  return glossStoryFlow(input);
}

const glossStoryFlow = ai.defineFlow(
  {
    name: 'glossStoryFlow',
    inputSchema: GlossStoryInputSchema,
    outputSchema: GlossStoryOutputSchema,
  },
  async input => {
    // Extract all words from the structured sentences, then get unique words.
    const allWords = input.sentences.flatMap(s => s.words.map(w => w.word));
    const uniqueWords = Array.from(
      new Set(
        allWords
          .map(word => word.toLowerCase().replace(/[.,·;]/g, ''))
          .filter(Boolean)
      )
    );

    const glossMap: GlossStoryOutput = {};

    // Create an array of promises, one for each unique word.
    const glossPromises = uniqueWords.map(async (word) => {
      try {
        // Call the individual glossWord flow for each word.
        const gloss = await glossWord({ word });
        if (gloss) {
          // The key is the normalized word.
          glossMap[word] = gloss;
        }
      } catch (error) {
        // If a single word fails, log the error and continue with the others.
        console.error(`Failed to gloss word "${word}":`, error);
      }
    });

    // Wait for all promises to settle (either resolve or reject).
    await Promise.all(glossPromises);

    return glossMap;
  }
);
