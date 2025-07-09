'use server';

import { StoryFormSchema } from '@/lib/schemas';
import { generateGreekStory } from '@/ai/flows/generate-greek-story';
import { generateStoryIllustration } from '@/ai/flows/generate-story-illustration';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

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
  docId?: string;
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

  try {
    const docRef = await addDoc(collection(db, "stories"), {
      ...storyData,
      createdAt: serverTimestamp(),
    });
    return { success: true, docId: docRef.id };
  } catch (error) {
    console.error("Error saving story to Firestore:", error);
    // This could be a configuration error, so provide a helpful message.
    return { error: 'Failed to save the story. Please ensure your Firebase configuration is correct and Firestore is enabled.' };
  }
}
