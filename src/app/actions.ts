'use server';

import { StoryFormSchema, GlossStoryOutputSchema, GlossWordOutputSchema } from '@/lib/schemas';
import { generateGreekStory } from '@/ai/flows/generate-greek-story';
import { generateStoryIllustration } from '@/ai/flows/generate-story-illustration';
import { glossWord } from '@/ai/flows/gloss-word';
import { glossStory } from '@/ai/flows/gloss-story-flow';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';

const STORY_TABLE = 'comic_stories';

export type GlossWordOutput = z.infer<typeof GlossWordOutputSchema>;
export type GlossStoryOutput = z.infer<typeof GlossStoryOutputSchema>;

export type StoryData = {
  topic: string;
  story: string;
  sentences: string[];
  illustrations: string[];
  grammar_scope: string;
  level: string;
  glosses: GlossStoryOutput;
}

// Type for the full story data, including illustrations
export type SavedStory = {
  id: number;
  created_at: string;
  topic: string;
  level: string;
  grammar_scope: string;
  story: string;
  illustrations: string[];
  glosses: GlossStoryOutput;
}

// Type for the list item, without illustrations for performance
export type SavedStoryListItem = Pick<SavedStory, 'id' | 'created_at' | 'topic' | 'level' | 'grammar_scope'>;


export type StoryResult = {
  data?: StoryData;
  error?: string;
  fieldErrors?: { [key: string]: string[] | undefined };
};

export type SaveResult = {
  success?: boolean;
  error?: string;
};

export type RegenerateResult = {
  data?: GlossStoryOutput;
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
    
    const story = sentences.join(' ');
    
    // Generate glosses in parallel with the first illustration.
    const glossesPromise = glossStory({ story });

    // Generate illustrations sequentially to maintain character consistency.
    const illustrations: string[] = [];
    let previousIllustrationDataUri: string | undefined = undefined;

    for (const sentence of sentences) {
      const result = await generateStoryIllustration({ sentence, previousIllustrationDataUri });
      illustrations.push(result.illustrationDataUri);
      previousIllustrationDataUri = result.illustrationDataUri;
    }

    const glosses = await glossesPromise;

    return { data: { 
      story, 
      sentences, 
      illustrations, 
      glosses,
      topic: validatedFields.data.topic, 
      level: validatedFields.data.level, 
      grammar_scope: validatedFields.data.grammarScope 
    } };

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
        { 
          story: storyData.story, 
          illustrations: storyData.illustrations, 
          topic: storyData.topic, 
          grammar_scope: storyData.grammar_scope, 
          level: storyData.level,
          glosses: storyData.glosses,
        },
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

// Fetches only the list of stories without illustrations
export async function getSavedStoriesAction(): Promise<SavedStoryListItem[]> {
  if (!supabase) {
    return [];
  }
  
  try {
    // Select only the necessary fields for the list view
    const { data, error } = await supabase
      .from(STORY_TABLE)
      .select('id, created_at, topic, level, grammar_scope')
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


// Fetches a single, complete story by its ID
export async function getStoryByIdAction(id: number): Promise<SavedStory | null> {
  if (!supabase) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from(STORY_TABLE)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error(`Error fetching story with id ${id}:`, error);
      return null;
    }
    return data;
  } catch (error) {
    console.error(`Error in getStoryByIdAction for id ${id}:`, error);
    return null;
  }
}

export type GlossResult = {
  data?: GlossWordOutput;
  error?: string;
};

export async function getWordGlossAction(word: string): Promise<GlossResult> {
  if (!word) {
    return { error: 'No word provided.' };
  }

  try {
    const gloss = await glossWord({ word });
    return { data: gloss };
  } catch (error) {
    console.error(`Error glossing word "${word}":`, error);
    return { error: 'Could not retrieve definition.' };
  }
}

export async function regenerateGlossesAction(storyId: number, storyText: string): Promise<RegenerateResult> {
  if (!supabase) {
    return { error: 'Supabase is not configured. Cannot update story.' };
  }

  try {
    // 1. Generate the new glosses with morphology
    const newGlosses = await glossStory({ story: storyText });

    // 2. Update the story in the database
    const { error: updateError } = await supabase
      .from(STORY_TABLE)
      .update({ glosses: newGlosses })
      .eq('id', storyId);

    if (updateError) {
      console.error(`Error updating glosses for story ${storyId}:`, updateError);
      return { error: `Failed to update story in database: ${updateError.message}` };
    }

    // 3. Return the new glosses to the client
    return { data: newGlosses };

  } catch (error) {
    console.error(`Error in regenerateGlossesAction for story ${storyId}:`, error);
    return { error: 'An unexpected error occurred while regenerating glosses.' };
  }
}
