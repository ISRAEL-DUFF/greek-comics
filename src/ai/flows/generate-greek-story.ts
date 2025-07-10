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
  sentences: z.array(z.string()).describe('The generated Ancient Greek story, as an array of sentences.'),
});
export type GenerateGreekStoryOutput = z.infer<typeof GenerateGreekStoryOutputSchema>;

export async function generateGreekStory(input: GenerateGreekStoryInput): Promise<GenerateGreekStoryOutput> {
  return generateGreekStoryFlow(input);
}

const generateGreekStoryPrompt = ai.definePrompt({
  name: 'generateGreekStoryPrompt',
  input: {schema: GenerateGreekStoryInputSchema},
  output: {schema: GenerateGreekStoryOutputSchema},
  prompt: `You are an expert in Ancient Greek language and literature. Your task is to generate a story in Ancient Greek based on the user's specifications.

  Level: {{{level}}}
  Topic: {{{topic}}}
  Grammar Scope: {{{grammarScope}}}

The story should be 3-10 sentences long and appropriate for the specified learner level. Use vocabulary and grammatical structures that are suitable for the level and grammar scope. The story should be coherent and engaging.

You MUST return the story as an array of sentences in the 'sentences' field of the JSON output.
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
