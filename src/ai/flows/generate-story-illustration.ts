'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating color illustrations for Ancient Greek story sentences.
 *
 * - generateStoryIllustration - A function that generates an image based on the given sentence.
 * - GenerateStoryIllustrationInput - The input type for the generateStoryIllustration function.
 * - GenerateStoryIllustrationOutput - The return type for the generateStoryIllustration function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateStoryIllustrationInputSchema = z.object({
  sentence: z
    .string()
    .describe('A sentence from an Ancient Greek story.'),
  previousIllustrationDataUri: z
    .string()
    .optional()
    .describe(
      "A data URI of the previously generated illustration to maintain character consistency. The data URI must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type GenerateStoryIllustrationInput = z.infer<typeof GenerateStoryIllustrationInputSchema>;

const GenerateStoryIllustrationOutputSchema = z.object({
  illustrationDataUri: z
    .string()
    .describe(
      'A data URI containing the base64 encoded image of the illustration for the sentence. The data URI must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.'    ),
});
export type GenerateStoryIllustrationOutput = z.infer<typeof GenerateStoryIllustrationOutputSchema>;

export async function generateStoryIllustration(input: GenerateStoryIllustrationInput): Promise<GenerateStoryIllustrationOutput> {
  return generateStoryIllustrationFlow(input);
}

const generateStoryIllustrationFlow = ai.defineFlow(
  {
    name: 'generateStoryIllustrationFlow',
    inputSchema: GenerateStoryIllustrationInputSchema,
    outputSchema: GenerateStoryIllustrationOutputSchema,
  },
  async ({ sentence, previousIllustrationDataUri }) => {
    
    const prompt: any[] = [];
    if (previousIllustrationDataUri) {
        prompt.push({ media: { url: previousIllustrationDataUri } });
        prompt.push({ text: `Generate an image that illustrates the following Ancient Greek sentence, maintaining the characters and style from the previous image: "${sentence}". The illustration should be in color and suitable for a children's story.` });
    } else {
        prompt.push({ text: `Generate an image that illustrates the following Ancient Greek sentence: "${sentence}". The illustration should be in color and suitable for a children's story.` });
    }

    const {media} = await ai.generate({
      // IMPORTANT: ONLY the googleai/gemini-2.0-flash-preview-image-generation model is able to generate images. You MUST use exactly this model to generate images.
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      prompt: prompt,
      config: {
        responseModalities: ['TEXT', 'IMAGE'], // MUST provide both TEXT and IMAGE, IMAGE only won't work
      },
    });
    
    if (!media || !media.url) {
      throw new Error('No image was generated.');
    }

    return { illustrationDataUri: media.url };
  }
);
