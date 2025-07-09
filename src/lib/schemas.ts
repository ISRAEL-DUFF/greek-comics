import { z } from 'zod';

export const StoryFormSchema = z.object({
  level: z.enum(['Beginner', 'Intermediate', 'Advanced']),
  topic: z.string().min(3, 'Topic must be at least 3 characters long.').max(100, 'Topic must be 100 characters or less.'),
  grammarScope: z.string().min(3, 'Grammar scope must be at least 3 characters long.').max(100, 'Grammar scope must be 100 characters or less.'),
});
