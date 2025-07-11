'use server';

/**
 * @fileOverview Provides a gloss for a single Ancient Greek word.
 *
 * - glossWord - A function that returns the definition and grammatical information for a word.
 * - GlossWordInput - The input type for the glossWord function.
 * - GlossWordOutput - The return type for the glossWord function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { GlossWordOutputSchema } from '@/lib/schemas';

const GlossWordInputSchema = z.object({
  word: z.string().describe('The Ancient Greek word to be glossed.'),
});
export type GlossWordInput = z.infer<typeof GlossWordInputSchema>;
export type GlossWordOutput = z.infer<typeof GlossWordOutputSchema>;

export async function glossWord(input: GlossWordInput): Promise<GlossWordOutput> {
  return glossWordFlow(input);
}

const glossWordPrompt = ai.definePrompt({
  name: 'glossWordPrompt',
  input: {schema: GlossWordInputSchema},
  output: {schema: GlossWordOutputSchema},
  prompt: `You are an expert Ancient Greek lexicographer. For the given word "{{word}}", provide its dictionary form (lemma), its part of speech, and a concise English definition.
  
  If the word is a verb, provide the principal parts as the lemma. If it's a noun or adjective, provide the nominative singular form.
  
  Your response must be in JSON format.`,
});

const glossWordFlow = ai.defineFlow(
  {
    name: 'glossWordFlow',
    inputSchema: GlossWordInputSchema,
    outputSchema: GlossWordOutputSchema,
  },
  async input => {
    // Normalize the word by removing common punctuation for better lookup.
    const normalizedWord = input.word.replace(/[.,·;]/g, '');
    const {output} = await glossWordPrompt({word: normalizedWord});
    return output!;
  }
);
