
'use server';

/**
 * @fileOverview Generates a book for vocabulary memorization.
 *
 * - generateVocabMemorizeBook - A function that generates the book content iteratively.
 * - generateBookCover - A function that generates the book cover image.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { generateBookCover as originalGenerateBookCover, GenerateBookCoverOutput } from './generate-greek-book-flow';


export async function generateBookCover(bookTitle: string, bookTopic: string): Promise<GenerateBookCoverOutput> {
    return originalGenerateBookCover(bookTitle, bookTopic);
}


const GenerateVocabMemorizeBookInputSchema = z.object({
  level: z.enum(['Beginner', 'Intermediate', 'Advanced']).describe('The learner level.'),
  vocabList: z.string().describe('A comma-separated list of vocabulary words to memorize.'),
  grammarScope: z.string().describe('The grammar scope to use in the book.'),
  numPages: z.number().min(1).max(10).describe('The number of pages in the book.'),
});
export type GenerateVocabMemorizeBookInput = z.infer<typeof GenerateVocabMemorizeBookInputSchema>;

const FootnoteSchema = z.object({
    word: z.string().describe('An important Greek word from the page.'),
    definition: z.string().describe('A simple definition of the word in Ancient Greek.'),
    illustrationPrompt: z.string().describe('A short, simple prompt for generating a small black and white illustration for this dictionary entry (e.g., "a small boat", "a running horse").')
});

const PageIllustrationSchema = z.object({
    prompt: z.string().describe('A detailed prompt for generating a full-color illustration for this page.'),
    illustrationUri: z.string().optional().describe('The data URI for the illustration.')
});

const SinglePageSchema = z.object({
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

const GenerateVocabMemorizeBookOutputSchema = z.object({
  title: z.string().describe('The title of the book.'),
  author: z.string().describe("The fictional Ancient Greek author's name."),
  pages: z.array(SinglePageSchema).describe('The array of pages that make up the book, with illustrated footnotes.'),
});
export type GenerateVocabMemorizeBookOutput = z.infer<typeof GenerateVocabMemorizeBookOutputSchema>;


export async function generateVocabMemorizeBook(input: GenerateVocabMemorizeBookInput): Promise<GenerateVocabMemorizeBookOutput> {
  return generateVocabMemorizeBookFlow(input);
}


const generatePagePrompt = ai.definePrompt({
    name: 'generateVocabMemorizePagePrompt',
    input: {schema: z.object({
        level: z.enum(['Beginner', 'Intermediate', 'Advanced']),
        vocabList: z.string(),
        grammarScope: z.string(),
        pageNumber: z.number(),
        previousPageText: z.string().optional(),
    })},
    output: {schema: SinglePageSchema},
    prompt: `You are an expert in Ancient Greek language and literature. Your task is to generate a single page for a story designed to help a user memorize a list of vocabulary words.

    **Instructions for Page {{pageNumber}}:**
    - Learner Level: {{{level}}}
    - Grammar Scope: {{{grammarScope}}}
    - **Core Vocabulary to Repeat:** {{{vocabList}}}
    {{#if previousPageText}}
    - **Previous Page Content (for context and continuity):**
      {{{previousPageText}}}
    {{/if}}

    **Your Task:**
    1.  Write the next page of the story. The page must contain at least two paragraphs.
    2.  The primary goal is to **naturally and frequently repeat the words from the Core Vocabulary list**.
    3.  If this is not the first page, continue the story from the "Previous Page Content". You should also try to re-use some important (non-core) vocabulary from the previous page to aid retention.
    4.  The story must be engaging and coherent for the specified learner 'level' and 'grammarScope'.
    5.  For the generated page, provide:
        a. A 'pageNumber'.
        b. An optional 'title' for the page.
        c. An array of 'paragraphs', each with Greek 'text' and an English 'translation'.
        d. A 'mainIllustrations' array with exactly TWO detailed prompts for full-color illustrations.
        e. A 'footnotes' array with 3-5 dictionary entries for key words on the page. Each entry needs a Greek 'word', a simple Greek 'definition', and a simple 'illustrationPrompt'.

    You MUST return the generated page as a single JSON object matching the specified output schema.
  `,
});

const generateVocabMemorizeBookFlow = ai.defineFlow(
  {
    name: 'generateVocabMemorizeBookFlow',
    inputSchema: GenerateVocabMemorizeBookInputSchema,
    outputSchema: GenerateVocabMemorizeBookOutputSchema,
  },
  async (input) => {
    const pages: z.infer<typeof SinglePageSchema>[] = [];
    let previousPageText: string | undefined = undefined;

    for (let i = 1; i <= input.numPages; i++) {
        const { output: pageOutput } = await generatePagePrompt({
            ...input,
            pageNumber: i,
            previousPageText: previousPageText,
        });

        if (!pageOutput) {
            throw new Error(`Failed to generate page ${i}.`);
        }

        pages.push(pageOutput);
        
        // Prepare the text from the current page to be used as context for the next page.
        previousPageText = pageOutput.paragraphs.map(p => p.text).join('\n');
    }

    return {
      title: `A Story of: ${input.vocabList.split(',').slice(0, 2).join(', ')}`,
      author: 'Μνημονικός (Mnemonikos)',
      pages: pages,
    };
  }
);
