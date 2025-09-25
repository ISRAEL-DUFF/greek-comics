
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
    prompt: `You are an expert teacher of Ancient Greek tasked with building spaced-repetition style narrative text. The reader must see every required vocabulary item repeatedly and in varied contexts while the story stays engaging and aligned with the target grammar.

    **Context for Page {{pageNumber}}**
    - Learner Level: {{{level}}}
    - Grammar Scope Focus: {{{grammarScope}}}
    - Core Vocabulary (split on commas and trim whitespace): {{{vocabList}}}
    {{#if previousPageText}}
    - Previous Page Text (continuity and reinforcement source):
      {{{previousPageText}}}
    {{/if}}

    **Repetition Algorithm (follow exactly)**
    1. Construct the ordered list 
       - \`coreWords\`: every individual word from the Core Vocabulary.
       - \`carryoverWords\`: when previous text is provided, identify the 3-5 most thematically important non-core Greek words that appeared in that text (e.g., recurring characters, objects, places). These words must continue to appear in the new page for continuity.
    2. Plan (internally) how each paragraph will weave multiple \`coreWords\` plus any \`carryoverWords\`. Do **not** output this plan; only return the JSON response.
    3. While writing the new page, ensure every item in \`coreWords\` appears **at least twice** across the page and never omit any item. Distribute their occurrences across the paragraphs so the repetition feels natural. Inflect the words appropriately, but keep stems recognizable for learners.
    4. When a previous page exists, also use each \`carryoverWord\` at least once on the new page and reuse other meaningful vocabulary from the previous page when it helps retention.

    **Writing Requirements**
    - Produce at least two coherent paragraphs in Greek, suitable for the stated level and grammar scope.
    - Each paragraph should contain multiple \`coreWords\`; avoid clustering all repetitions into a single sentence.
    - Provide natural, line-aligned English translations for every paragraph.
    - Maintain a clear, continuous narrative that references prior events when \`previousPageText\` is supplied.

    **Structured Output**
    - Return JSON that matches the required schema exactly.
    - Include exactly TWO detailed, vivid prompts in \`mainIllustrations\` that highlight different moments from this page and mention some \`coreWords\` where appropriate.
    - Provide 3-5 footnotes focusing on important Greek words from this page (prioritize \`coreWords\` and key \`carryoverWords\`). Each footnote must have a concise definition in simple Ancient Greek and a minimalist illustration prompt.

    Do not output explanatory prose, plans, or markdown. Respond with a single JSON object matching the schema.
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
