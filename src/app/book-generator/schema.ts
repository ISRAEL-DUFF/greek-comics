
import { z } from 'zod';

export const BookFormSchema = z.object({
    level: z.enum(['Beginner', 'Intermediate', 'Advanced']),
    topic: z.string().min(3, 'Topic must be at least 3 characters long.').max(100, 'Topic must be 100 characters or less.'),
    grammarScope: z.string().min(3, 'Grammar scope must be at least 3 characters long.').max(100, 'Grammar scope must be 100 characters or less.'),
    numPages: z.coerce.number().int().min(1, 'Must be at least 1 page.').max(10, 'Cannot be more than 10 pages.').default(3),
});
