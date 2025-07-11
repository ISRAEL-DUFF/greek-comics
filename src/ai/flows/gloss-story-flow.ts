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
import { GlossStoryOutputSchema } from '@/lib/schemas';

const GlossStoryInputSchema = z.object({
  story: z.string().describe('The Ancient Greek story to be glossed.'),
});
export type GlossStoryInput = z.infer<typeof GlossStoryInputSchema>;
export type GlossStoryOutput = z.infer<typeof GlossStoryOutputSchema>;

export async function glossStory(input: GlossStoryInput): Promise<GlossStoryOutput> {
  return glossStoryFlow(input);
}

const glossStoryPrompt = ai.definePrompt({
  name: 'glossStoryPrompt',
  input: {schema: GlossStoryInputSchema},
  output: {schema: GlossStoryOutputSchema},
  prompt: `You are an expert Ancient Greek lexicographer. For the given story, identify all unique words. For each unique word, provide its dictionary form (lemma), its part of speech, and a concise English definition.
  
  The output should be a JSON object where each key is a unique, lowercased word from the text and the value is an object containing its lemma, partOfSpeech, and definition.
  
  Story:
  {{{story}}}
  `,
});

const glossStoryFlow = ai.defineFlow(
  {
    name: 'glossStoryFlow',
    inputSchema: GlossStoryInputSchema,
    outputSchema: GlossStoryOutputSchema,
  },
  async input => {
    // Sanitize the story to get a clean word list.
    const uniqueWords = Array.from(
      new Set(
        input.story
          .toLowerCase()
          .replace(/[.,·;]/g, '')
          .split(/\s+/)
          .filter(Boolean)
      )
    );

    // Rejoin the unique words to pass to the prompt. This can be more efficient than sending the whole story if the story is long and has many repeated words.
    const {output} = await glossStoryPrompt({story: uniqueWords.join(' ')});
    return output!;
  }
);
