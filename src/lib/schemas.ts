import { z } from 'zod';

export const StoryFormSchema = z.object({
  level: z.enum(['Beginner', 'Intermediate', 'Advanced']),
  topic: z.string().min(3, 'Topic must be at least 3 characters long.').max(100, 'Topic must be 100 characters or less.'),
  grammarScope: z.string().min(3, 'Grammar scope must be at least 3 characters long.').max(100, 'Grammar scope must be 100 characters or less.'),
});

export const GlossWordOutputSchema = z.object({
  lemma: z.string().describe('The dictionary form (lemma) of the word.'),
  partOfSpeech: z.string().describe('The part of speech of the word (e.g., Noun, Verb).'),
  definition: z.string().describe('A concise English definition of the word.'),
  morphology: z.string().optional().describe('A concise morphological analysis (e.g., "Noun, Nom, Sg, Masc").'),
});

export const GlossStoryOutputSchema = z.record(z.string(), GlossWordOutputSchema)
  .describe('A map where keys are the normalized words from the story and values are their glosses.');
