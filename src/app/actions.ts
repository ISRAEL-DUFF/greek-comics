'use server';

import { StoryFormSchema } from '@/lib/schemas';
import { generateGreekStory } from '@/ai/flows/generate-greek-story';
import { generateStoryIllustration } from '@/ai/flows/generate-story-illustration';

export type StoryData = {
  story: string;
  illustrations: string[];
}

export type StoryResult = {
  data?: StoryData;
  error?: string;
  fieldErrors?: { [key: string]: string[] | undefined };
};

export type SaveResult = {
  success?: boolean;
  error?: string;
};

export async function generateStoryAction(
  formData: FormData
): Promise<StoryResult> {
  const validatedFields = StoryFormSchema.safeParse({
    level: formData.get('level'),
    topic: formData.get('topic'),
    grammarScope: formData.get('grammarScope'),
  });

  if (!validatedFields.success) {
    return {
      error: "Invalid form data. Please check the fields and try again.",
      fieldErrors: validatedFields.error.flatten().fieldErrors,
    };
  }
  
  try {
    const { story } = await generateGreekStory(validatedFields.data);
    
    // Split story into sentences. This is a simple approach and assumes sentences end with a period.
    const sentences = story.split('.').filter(s => s.trim().length > 0).map(s => s.trim() + '.');

    if (sentences.length === 0) {
      return { error: 'Generated story was empty or could not be split into sentences.' };
    }
    
    // Generate illustrations for each sentence in parallel.
    const illustrationResults = await Promise.all(
      sentences.map(sentence => generateStoryIllustration({ sentence }))
    );
    
    const illustrations = illustrationResults.map(res => res.illustrationDataUri);
    
    return { data: { story, illustrations } };

  } catch (error) {
    console.error("Error in generateStoryAction:", error);
    return { error: 'An unexpected error occurred while generating the story. The AI service may be temporarily unavailable. Please try again later.' };
  }
}

export async function saveStoryAction(
  storyData: StoryData
): Promise<SaveResult> {
  if (!storyData || !storyData.story || !storyData.illustrations) {
    return { error: 'Invalid story data provided.' };
  }

  const apiUrl = process.env.NEXT_PUBLIC_CUSTOM_BACKEND_API_URL;
  if (!apiUrl) {
    console.error("Custom backend API URL is not configured.");
    return { error: 'The application is not configured to save stories. Please contact the administrator.' };
  }

  try {
    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(storyData),
    });

    if (!response.ok) {
        const errorData = await response.text();
        console.error("Error saving story to custom backend:", response.statusText, errorData);
        return { error: `Failed to save story. The server responded with: ${response.statusText}` };
    }

    return { success: true };

  } catch (error) {
    console.error("Error calling custom backend API:", error);
    return { error: 'An unexpected error occurred while trying to save the story.' };
  }
}
