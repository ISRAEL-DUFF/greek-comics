'use server';

/**
 * @fileOverview Provides a detailed expansion for a single Ancient Greek word.
 *
 * - expandWord - A function that returns a detailed analysis of a word in Markdown format.
 * - ExpandWordInput - The input type for the expandWord function.
 * - ExpandWordOutput - The return type for the expandWord function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExpandWordInputSchema = z.object({
  word: z.string().describe('The Ancient Greek word to be expanded.'),
});
export type ExpandWordInput = z.infer<typeof ExpandWordInputSchema>;

const ExpandWordOutputSchema = z.object({
    expansion: z.string().describe('The detailed word analysis in Markdown format, including tables for paradigms.')
});
export type ExpandWordOutput = z.infer<typeof ExpandWordOutputSchema>;


export async function expandWord(input: ExpandWordInput): Promise<ExpandWordOutput> {
  return expandWordFlow(input);
}

const expandWordPrompt = ai.definePrompt({
  name: 'expandWordPrompt',
  input: {schema: ExpandWordInputSchema},
  output: {schema: ExpandWordOutputSchema},
  prompt: `You are an expert Ancient Greek lexicographer and grammarian. For the given word "{{word}}", provide a detailed analysis based on its part of speech. Your entire response must be in well-formatted Markdown. Use Markdown tables for paradigms.

**If the word is a VERB:**
1.  **Gloss**: Provide its dictionary form (lemma), part of speech, and a concise English definition.
2.  **Principal Parts**: Generate a Markdown table of its principal parts.
3.  **Full Conjugation**: Generate full conjugation paradigms in Markdown tables for all tenses and moods (Indicative, Subjunctive, Optative, Imperative), including participles and infinitives.
4.  **Etymology**: Provide a detailed etymology of the word.

**If the word is a PARTICIPLE:**
1.  **Identification**: Identify the verb it is derived from.
2.  **Principal Parts**: Generate a Markdown table of the source verb's principal parts.
3.  **Full Declension**: Generate the full declension paradigm for the participle in all genders, numbers, and cases, including translations for each form (e.g., "λύων - releasing (m. nom. sg.)"). Use a Markdown table.
4.  **Etymology**: Provide a detailed etymology of the source verb.
5.  **Usage**: Provide a detailed description of the participle's usage in a sentence.

**If the word is a NOUN:**
1.  **Gloss**: Provide its dictionary form (lemma), part of speech (including gender), and a concise English definition.
2.  **Full Declension**: Generate its full declension paradigm in a Markdown table.
3.  **Etymology**: Provide a detailed etymology of the word, including its root/stem.

**If the word is an ADJECTIVE:**
1.  **Gloss**: Provide its dictionary form (lemma) and a concise English definition.
2.  **Full Declension**: Generate its full declension paradigm for all genders in a Markdown table.
3.  **Etymology**: Provide a detailed etymology of the word, including its root/stem.
4.  **Usage**: Provide a detailed description of the adjective's usage in a sentence.

**If it is any OTHER type of word (e.g., preposition, adverb, conjunction):**
1.  **Description**: Describe the word and its function.
2.  **Etymology**: Provide a detailed etymology of the word, including its root/stem.
3.  **Usage**: Provide a detailed description of the word's usage in a sentence with examples.

Your output MUST be a single Markdown string in the 'expansion' field of the JSON response.
`,
});

const expandWordFlow = ai.defineFlow(
  {
    name: 'expandWordFlow',
    inputSchema: ExpandWordInputSchema,
    outputSchema: ExpandWordOutputSchema,
  },
  async input => {
    // Normalize the word by removing common punctuation for better lookup.
    const normalizedWord = input.word.toLowerCase().replace(/[.,·;]/g, '');
    const {output} = await expandWordPrompt({word: normalizedWord});
    return output!;
  }
);
