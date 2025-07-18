'use server';

/**
 * @fileOverview Generates short stories in Ancient Greek based on user-selected level and grammar scope.
 *
 * - generateGreekStory - A function that generates the story.
 * - GenerateGreekStoryInput - The input type for the generateGreekStory function.
 * - GenerateGreekStoryOutput - The return type for the generateGreekStory function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateGreekStoryInputSchema = z.object({
  level: z.enum(['Beginner', 'Intermediate', 'Advanced']).describe('The learner level.'),
  topic: z.string().describe('The topic of the story.'),
  grammarScope: z.string().describe('The grammar scope to use in the story.'),
});
export type GenerateGreekStoryInput = z.infer<typeof GenerateGreekStoryInputSchema>;

const GenerateGreekStoryOutputSchema = z.object({
  sentences: z.array(z.object({
    sentence: z.string().describe('A single sentence in Ancient Greek.'),
    words: z.array(z.object({
        word: z.string().describe('A single word from the sentence.'),
        syntaxNote: z.string().describe('Concise syntax note explaining the grammatical role of this specific word in the sentence (e.g., "subject of verb λύει", "dative of possession").')
    })).describe('An array of word objects, each with a syntax note.'),
  })).describe('The generated Ancient Greek story, as an array of sentence objects.'),
});
export type GenerateGreekStoryOutput = z.infer<typeof GenerateGreekStoryOutputSchema>;

export async function generateGreekStory(input: GenerateGreekStoryInput): Promise<GenerateGreekStoryOutput> {
  return generateGreekStoryFlow(input);
}

const generateGreekStoryPrompt = ai.definePrompt({
  name: 'generateGreekStoryPrompt',
  input: {schema: GenerateGreekStoryInputSchema},
  output: {schema: GenerateGreekStoryOutputSchema},
  prompt: `You are an expert in Ancient Greek language and literature. You are proficient in the Attic dialect from 5th–4th century BCE. Your task is to generate a story in Attic Greek based on the user's specifications.

  Level: {{{level}}}
  Topic: {{{topic}}}
  Grammar Scope: {{{grammarScope}}}

The story should be appropriate for the specified learner level. Use vocabulary and grammatical structures that are suitable for the level and grammar scope. The story should be coherent and engaging.

For each sentence you generate, you MUST provide a detailed breakdown for EACH word. This breakdown must include the word itself and a concise syntax note explaining its specific grammatical role in the sentence (e.g., "subject of verb", "dative of means", "modifies noun").

You MUST return the story as an array of sentence objects in the 'sentences' field of the JSON output. Each sentence object must contain the full 'sentence' string, and an array 'words', where each item has the 'word' and its 'syntaxNote'. Ensure the words in the 'words' array (including punctuation) reconstruct the 'sentence' exactly when joined with spaces.
`,
});

const generateGreekStoryFlow = ai.defineFlow(
  {
    name: 'generateGreekStoryFlow',
    inputSchema: GenerateGreekStoryInputSchema,
    outputSchema: GenerateGreekStoryOutputSchema,
  },
  async input => {
    const {output} = await generateGreekStoryPrompt(input);
    return output!;
  }
);
