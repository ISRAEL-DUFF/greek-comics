
'use server';

/**
 * @fileOverview Generates a book in Ancient Greek with pages, paragraphs, and a cover.
 *
 * - generateGreekBook - A function that generates the book content.
 * - generateBookCover - A function that generates the book cover image.
 * - GenerateGreekBookInput - The input type for the book generation.
 * - GenerateGreekBookOutput - The return type for the book generation.
 * - GenerateBookCoverOutput - The return type for the cover generation.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateGreekBookInputSchema = z.object({
  level: z.enum(['Beginner', 'Intermediate', 'Advanced']).describe('The learner level.'),
  topic: z.string().describe('The topic of the book.'),
  grammarScope: z.string().describe('The grammar scope to use in the book.'),
  numPages: z.number().min(1).max(10).describe('The number of pages in the book.'),
});
export type GenerateGreekBookInput = z.infer<typeof GenerateGreekBookInputSchema>;

const FootnoteSchema = z.object({
    word: z.string().describe('An important Greek word from the page.'),
    definition: z.string().describe('A simple definition of the word in Ancient Greek.'),
    illustrationPrompt: z.string().describe('A short, simple prompt for generating a small black and white illustration for this dictionary entry (e.g., "a small boat", "a running horse").')
});

const PageIllustrationSchema = z.object({
    prompt: z.string().describe('A detailed prompt for generating a full-color illustration for this page.'),
    illustrationUri: z.string().optional().describe('The data URI for the illustration.')
});

const PageSchema = z.object({
    pageNumber: z.number().describe('The page number.'),
    title: z.string().optional().describe('The title of the page, if applicable.'),
    paragraphs: z.array(z.object({
        text: z.string().describe('A paragraph of the story in Ancient Greek.'),
        translation: z.string().describe('The English translation of the paragraph.'),
    })).describe('An array of paragraphs for the page.'),
    mainIllustrations: z.array(PageIllustrationSchema).describe('An array of exactly 2 illustrations for the page content.'),
    footnotes: z.array(FootnoteSchema.extend({
        illustrationUri: z.string().optional().describe('The data URI for the footnote illustration.')
    }))
});

const GenerateGreekBookOutputSchema = z.object({
  title: z.string().describe('The title of the book.'),
  author: z.string().describe("The fictional Ancient Greek author's name."),
  pages: z.array(PageSchema).describe('The array of pages that make up the book, with illustrated footnotes.'),
});
export type GenerateGreekBookOutput = z.infer<typeof GenerateGreekBookOutputSchema>;


export async function generateGreekBook(input: GenerateGreekBookInput): Promise<GenerateGreekBookOutput> {
  return generateGreekBookFlow(input);
}

const generateGreekBookPrompt = ai.definePrompt({
  name: 'generateGreekBookPrompt',
  input: {schema: GenerateGreekBookInputSchema},
  output: {schema: GenerateGreekBookOutputSchema},
  prompt: `You are an expert in Ancient Greek language and literature. Your task is to generate a short book in Attic Greek based on the user's specifications. The book should be structured with a main title, a fictional author, and multiple pages.

  Level: {{{level}}}
  Topic: {{{topic}}}
  Grammar Scope: {{{grammarScope}}}
  Number of Pages: {{{numPages}}}

  Instructions:
  1.  Create a compelling 'title' for the entire book.
  2.  Invent a plausible Ancient Greek 'author' name.
  3.  Generate exactly {{{numPages}}} pages.
  4.  For each page, provide a 'pageNumber'.
  5.  For each page, you may optionally provide a short 'title'.
  6.  For each page, write AT LEAST TWO paragraphs. Each paragraph must have Greek 'text' and an English 'translation'.
  7.  For each page, generate a 'mainIllustrations' array containing exactly TWO detailed prompts for generating full-color illustrations of key scenes on that page. Leave the 'illustrationUri' field empty.
  8.  For each page, identify 3-5 important vocabulary words. For each word, create a 'footnotes' entry with:
      a. The 'word' itself.
      b. A simple 'definition' for the word in Ancient Greek (define Greek with Greek).
      c. A short, simple 'illustrationPrompt' for generating a small, minimalist, black and white sketch (e.g., "a running horse", "a small boat", "a tree"). Leave the 'illustrationUri' field empty.
  9.  Ensure the vocabulary and grammar are suitable for the specified 'level' and 'grammarScope'.
  10. The 'illustrationUri' fields for all illustrations (main and footnote) should be left empty. They will be populated later.

  You MUST return the entire book as a single JSON object matching the specified output schema.
`,
});

const generateGreekBookFlow = ai.defineFlow(
  {
    name: 'generateGreekBookFlow',
    inputSchema: GenerateGreekBookInputSchema,
    outputSchema: GenerateGreekBookOutputSchema,
  },
  async input => {
    // Generate the book content without any illustrations.
    const {output} = await generateGreekBookPrompt(input);
    if (!output) {
        throw new Error('Failed to generate book content.');
    }
    return output;
  }
);


// Separate flow for generating the cover
const GenerateBookCoverOutputSchema = z.object({
    coverIllustrationUri: z
      .string()
      .describe(
        'A data URI containing the base64 encoded image of the book cover. The data URI must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.'
      ),
});
export type GenerateBookCoverOutput = z.infer<typeof GenerateBookCoverOutputSchema>;

export async function generateBookCover(bookTitle: string, bookTopic: string): Promise<GenerateBookCoverOutput> {
    return generateBookCoverFlow({title: bookTitle, topic: bookTopic});
}

const generateBookCoverFlow = ai.defineFlow(
    {
      name: 'generateBookCoverFlow',
      inputSchema: z.object({ title: z.string(), topic: z.string() }),
      outputSchema: GenerateBookCoverOutputSchema,
    },
    async ({ title, topic }) => {
      
      const prompt = `Generate a book cover illustration for an Ancient Greek story.
      Book Title: "${title}"
      Theme: ${topic}
      Style: Ancient Greek pottery style, color illustration, dramatic and epic. Do not include any text on the cover.`;
  
      const {media} = await ai.generate({
        model: 'googleai/gemini-2.0-flash-preview-image-generation',
        prompt: [{ text: prompt }],
        config: {
          responseModalities: ['TEXT', 'IMAGE'],
        },
      });
      
      if (!media || !media.url) {
        throw new Error('No cover image was generated.');
      }
  
      return { coverIllustrationUri: media.url };
    }
  );


