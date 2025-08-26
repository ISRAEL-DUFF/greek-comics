
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { generateAndSaveWordExpansionAction } from '@/app/word-expansion/actions';

const requestSchema = z.object({
    word: z.string().min(1, 'A word is required in the request body.'),
});

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const validated = requestSchema.safeParse(body);

        if (!validated.success) {
            return NextResponse.json(
                { error: validated.error.flatten().fieldErrors.word?.[0] || 'Invalid request body.' },
                { status: 400 }
            );
        }

        const result = await generateAndSaveWordExpansionAction(validated.data.word);

        return NextResponse.json(result, { status: 200 });

    } catch (error) {
        console.error('[API_EXPAND_WORD_POST]', error);
        const errorMessage = error instanceof Error ? error.message : 'An unexpected internal error occurred.';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
