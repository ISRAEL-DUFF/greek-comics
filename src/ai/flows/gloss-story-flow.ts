'use server';

/**
 * @fileOverview Provides glosses for all unique words in a given story using an efficient batching and retry mechanism.
 *
 * - glossStory - A function that returns a map of words to their definitions.
 * - GlossStoryInput - The input type for the glossStory function.
 * - GlossStoryOutput - The return type for the glossStory function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { GlossStoryOutputSchema } from '@/lib/schemas';
import { glossWords } from './gloss-words';

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

const MAX_RETRIES = 3;

const glossStoryFlow = ai.defineFlow(
  {
    name: 'glossStoryFlow',
    inputSchema: GlossStoryInputSchema,
    outputSchema: GlossStoryOutputSchema,
  },
  async input => {
    // Extract all words from the structured sentences, then get unique words.
    const allWords = input.sentences.flatMap(s => s.words.map(w => w.word));
    let wordsToGloss = Array.from(
      new Set(
        allWords
          .map(word => word.toLowerCase().replace(/[.,·;]/g, ''))
          .filter(Boolean)
      )
    );

    const glossMap: GlossStoryOutput = {};
    let retries = 0;

    while (wordsToGloss.length > 0 && retries < MAX_RETRIES) {
      if (retries > 0) {
        console.log(`Retrying ${wordsToGloss.length} words that failed to gloss...`);
      }

      try {
        const result = await glossWords({ words: wordsToGloss });
        
        // Add successfully glossed words to our main map
        for (const word in result) {
            if(result[word]) {
                glossMap[word] = result[word];
            }
        }

        // Determine which words were missed by the AI and need to be retried
        wordsToGloss = wordsToGloss.filter(word => !result.hasOwnProperty(word.toLowerCase()));

      } catch (error) {
        console.error(`An error occurred during a batch gloss attempt (retry ${retries + 1}):`, error);
        // On error, we don't know which words succeeded, so we retry the whole remaining batch.
      }
      retries++;
    }

    if (wordsToGloss.length > 0) {
        console.warn(`After ${MAX_RETRIES} retries, ${wordsToGloss.length} words could not be glossed:`, wordsToGloss);
    }

    return glossMap;
  }
);
