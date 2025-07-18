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
import type { Sentence } from '@/app/actions';

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


const GlossStoryInternalOutputSchema = z.object({
    glosses: z.array(z.object({
        word: z.string().describe('The word from the story.'),
        gloss: GlossWordOutputSchema.describe('The gloss for the word.'),
    })).describe('An array of word-gloss pairs.')
});

export async function glossStory(input: GlossStoryInput): Promise<GlossStoryOutput> {
  return glossStoryFlow(input);
}

const glossStoryPrompt = ai.definePrompt({
  name: 'glossStoryPrompt',
  input: {schema: z.object({ story: z.string().describe('A space-separated list of unique words from the story.') })},
  output: {schema: GlossStoryInternalOutputSchema},
  prompt: `You are an expert Ancient Greek lexicographer. For the given list of unique words, provide a gloss for each. Each gloss must contain its dictionary form (lemma), its part of speech, a concise English definition, and a morphological analysis.
  
  The morphological analysis should be concise (e.g., "Noun, Nom, Sg, Masc" or "Verb, Pres, Act, Ind, 3rd, Sg").

  The output should be a JSON object containing a 'glosses' field, which is an array of objects. Each object in the array should have a 'word' and a 'gloss' containing its lemma, partOfSpeech, definition, and morphology.
  
  Unique Words:
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
    // Extract all words from the structured sentences, then get unique words.
    const allWords = input.sentences.flatMap(s => s.words.map(w => w.word));
    const uniqueWords = Array.from(
      new Set(
        allWords
          .map(word => word.toLowerCase().replace(/[.,·;]/g, ''))
          .filter(Boolean)
      )
    );

    // Rejoin the unique words to pass to the prompt.
    const {output} = await glossStoryPrompt({story: uniqueWords.join(' ')});
    
    if (!output) {
        return {};
    }

    // Transform the array of glosses back into the map format the application expects.
    const glossMap: GlossStoryOutput = {};
    for (const item of output.glosses) {
        // The AI might return the gloss for the normalized word, so we key it by that.
        glossMap[item.word.toLowerCase()] = item.gloss;
    }

    return glossMap;
  }
);
