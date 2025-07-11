'use server';

import { StoryFormSchema } from '@/lib/schemas';
import { generateGreekStory } from '@/ai/flows/generate-greek-story';
import { generateStoryIllustration } from '@/ai/flows/generate-story-illustration';
import { supabase } from '@/lib/supabase';

// generateGif.js
// import fs from 'fs';
// import { createCanvas, loadImage } from 'canvas';
// import GIFEncoder from 'gifencoder';

// async function generateGifFromBase64(params: {
//   base64Images: string[],
//   outputPath: string,
//   width: number,
//   height: number
//   delay?: number
// }): Promise<void> {
//   const {base64Images, outputPath, width, height, delay = 700} = params;
//   const encoder = new GIFEncoder(width, height);
//   const canvas = createCanvas(width, height);
//   const ctx = canvas.getContext('2d');

//   const stream = fs.createWriteStream(outputPath);
//   encoder.createReadStream().pipe(stream);

//   encoder.start();
//   encoder.setRepeat(0); // loop forever
//   encoder.setDelay(delay);
//   encoder.setQuality(10);

//   for (const base64 of base64Images) {
//     const buffer = Buffer.from(base64, 'base64');
//     const img = await loadImage(buffer);

//     ctx.clearRect(0, 0, width, height);
//     ctx.drawImage(img, 0, 0, width, height);
//     encoder.addFrame(ctx);
//   }

//   encoder.finish();

//   return new Promise((resolve) => {
//     stream.on('finish', () => {
//       console.log(`✅ GIF created at: ${outputPath}`);
//       resolve();
//     });
//   });
// }

const STORY_TABLE = 'comic_stories';

export type StoryData = {
  topic: string;
  story: string;
  sentences: string[];
  illustrations: string[];
  grammar_scope: string;
  level: string;
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

    return { data: { story, sentences, illustrations, topic: validatedFields.data.topic, level: validatedFields.data.level, grammar_scope: validatedFields.data.grammarScope } };

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
        { story: storyData.story, illustrations: storyData.illustrations, topic: storyData.topic, 
          grammar_scope: storyData.grammar_scope, level: storyData.level },
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

    // generateGifFromBase64({
    //   base64Images: data.illustrations,
    //   width: 512,
    //   height: 512,
    //   outputPath: './output.gif',
    // });

    return data;
  } catch (error) {
    console.error(`Error in getStoryByIdAction for id ${id}:`, error);
    return null;
  }
}
