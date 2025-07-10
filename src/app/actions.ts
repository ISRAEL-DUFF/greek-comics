'use server';

import { StoryFormSchema } from '@/lib/schemas';
import { generateGreekStory } from '@/ai/flows/generate-greek-story';
import { generateStoryIllustration } from '@/ai/flows/generate-story-illustration';
import { supabase } from '@/lib/supabase';

const STORY_TABLE = 'comic_stories';

export type StoryData = {
  story: string;
  sentences: string[];
  illustrations: string[];
}

export type SavedStory = {
  id: number;
  created_at: string;
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
    const { sentences } = await generateGreekStory(validatedFields.data);
    
    if (!sentences || sentences.length === 0) {
      return { error: 'Generated story was empty or could not be split into sentences.' };
    }
    
    // Generate illustrations for each sentence in parallel.
    const illustrationResults = await Promise.all(
      sentences.map(sentence => generateStoryIllustration({ sentence }))
    );
    
    const illustrations = illustrationResults.map(res => res.illustrationDataUri);
    
    // Join sentences for a full story string, but also pass the array.
    const story = sentences.join(' ');

    return { data: { story, sentences, illustrations } };

  } catch (error) {
    console.error("Error in generateStoryAction:", error);
    return { error: 'An unexpected error occurred while generating the story. The AI service may be temporarily unavailable. Please try again later.' };
  }
}

export async function saveStoryAction(
  storyData: StoryData
): Promise<SaveResult> {
  if (!supabase) {
    return { error: 'Supabase is not configured. Cannot save story.' };
  }
  
  if (!storyData || !storyData.story || !storyData.illustrations) {
    return { error: 'Invalid story data provided.' };
  }

  try {
    const { error } = await supabase
      .from(STORY_TABLE)
      .insert([
        { story: storyData.story, illustrations: storyData.illustrations },
      ]);

    if (error) {
      console.error("Error saving story to Supabase:", error);
      return { error: `Failed to save story: ${error.message}` };
    }

    return { success: true };

  } catch (error: any) {
    console.error("Error calling Supabase:", error);
    return { error: 'An unexpected error occurred while trying to save the story.' };
  }
}

export async function getSavedStoriesAction(): Promise<SavedStory[]> {
  if (!supabase) {
    return [];
  }
  
  try {
    const { data, error } = await supabase
      .from(STORY_TABLE)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching stories from Supabase:", error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error("Error in getSavedStoriesAction:", error);
    return [];
  }
}
