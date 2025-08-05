'use server';

/**
 * @fileOverview Provides glosses for a batch of Ancient Greek words.
 *
 * - glossWords - A function that returns a map of words to their definitions.
 * - GlossWordsInput - The input type for the glossWords function.
 * - GlossWordsOutput - The return type for the glossWords function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { GlossStoryOutputSchema } from '@/lib/schemas';

const GlossWordsInputSchema = z.object({
  words: z.array(z.string()).describe('A list of Ancient Greek words to be glossed.'),
});
export type GlossWordsInput = z.infer<typeof GlossWordsInputSchema>;
export type GlossWordsOutput = z.infer<typeof GlossStoryOutputSchema>;

export async function glossWords(input: GlossWordsInput): Promise<GlossWordsOutput> {
  return glossWordsFlow(input);
}

const glossWordsPrompt = ai.definePrompt({
  name: 'glossWordsPrompt',
  input: {schema: GlossWordsInputSchema},
  output: {schema: GlossStoryOutputSchema},
  prompt: `You are an expert Ancient Greek lexicographer. For the given list of words, provide their dictionary form (lemma), part of speech, a concise English definition, and a morphological analysis.

  Your response must be a JSON object that maps each word from the input array to its corresponding gloss data. The keys in the output map must be the normalized (lowercase, no punctuation) words.

  For each word, provide:
  1.  'lemma': The dictionary form (e.g., principal parts for verbs, nominative singular for nouns).
  2.  'partOfSpeech': The word's part of speech.
  3.  'definition': A concise English definition.
  4.  'morphology': A concise morphological analysis (e.g., "Noun, Nom, Sg, Masc").

  Input Words:
  {{#each words}}
  - {{this}}
  {{/each}}

  Return a single JSON object. Ensure every word from the input list is a key in the output JSON.`,
});

const glossWordsFlow = ai.defineFlow(
  {
    name: 'glossWordsFlow',
    inputSchema: GlossWordsInputSchema,
    outputSchema: GlossStoryOutputSchema,
  },
  async input => {
    if (input.words.length === 0) {
      return {};
    }
    const {output} = await glossWordsPrompt(input);
    return output!;
  }
);
