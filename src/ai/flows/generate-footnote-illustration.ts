
'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating a single illustration for a book footnote.
 *
 * - generateFootnoteIllustration - A function that generates an image based on the given prompt.
 * - GenerateFootnoteIllustrationInput - The input type for the generateFootnoteIllustration function.
 * - GenerateFootnoteIllustrationOutput - The return type for the generateFootnoteIllustration function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateFootnoteIllustrationInputSchema = z.object({
  prompt: z
    .string()
    .describe('A short, simple prompt for generating a small, minimalist, black and white icon-style sketch.'),
});
export type GenerateFootnoteIllustrationInput = z.infer<typeof GenerateFootnoteIllustrationInputSchema>;

const GenerateFootnoteIllustrationOutputSchema = z.object({
  illustrationUri: z
    .string()
    .describe(
      'A data URI containing the base64 encoded image of the illustration. The data URI must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.'
    ),
});
export type GenerateFootnoteIllustrationOutput = z.infer<typeof GenerateFootnoteIllustrationOutputSchema>;

export async function generateFootnoteIllustration(input: GenerateFootnoteIllustrationInput): Promise<GenerateFootnoteIllustrationOutput> {
  return generateFootnoteIllustrationFlow(input);
}

const generateFootnoteIllustrationFlow = ai.defineFlow(
  {
    name: 'generateFootnoteIllustrationFlow',
    inputSchema: GenerateFootnoteIllustrationInputSchema,
    outputSchema: GenerateFootnoteIllustrationOutputSchema,
  },
  async ({ prompt }) => {
    
    const fullPrompt = `A small, simple, minimalist, black and white icon-style sketch of: ${prompt}.`;

    const {media} = await ai.generate({
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      prompt: [{ text: fullPrompt }],
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });
    
    if (!media || !media.url) {
      throw new Error('No image was generated for the footnote.');
    }

    return { illustrationUri: media.url };
  }
);
