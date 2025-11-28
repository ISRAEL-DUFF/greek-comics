
'use server';

import { supabase } from '@/lib/supabase';

const STORY_TABLE = 'comic_stories';
const BOOKS_TABLE = 'books';
const EXPANDED_WORDS_TABLE = 'expanded_words';
const NOTES_TABLE = 'notes';


export type StoriesByLevel = {
  level: string;
  count: number;
};

export type DashboardMetrics = {
  storyCount: number;
  wordCount: number;
  noteCount: number;
  storiesByLevel: StoriesByLevel[];
};

export async function getDashboardMetricsAction(): Promise<DashboardMetrics> {

  if (!supabase) {
    return {
      storyCount: 0,
      wordCount: 0,
      noteCount: 0,
      storiesByLevel: [],
    };
  }

  try {
    const [
      { count: storyCount, error: storyError },
      { count: wordCount, error: wordError },
      { count: noteCount, error: noteError },
      { data: storiesByLevelData, error: storiesByLevelError },
    ] = await Promise.all([
      supabase.from(STORY_TABLE).select('*', { count: 'exact', head: true }),
      supabase.from(EXPANDED_WORDS_TABLE).select('*', { count: 'exact', head: true }),
      supabase.from(NOTES_TABLE).select('*', { count: 'exact', head: true }),
      supabase.from(STORY_TABLE).select('level'),
    ]);

    if (storyError || wordError || noteError || storiesByLevelError) {
      console.error('Error fetching dashboard metrics:', {
        storyError,
        wordError,
        noteError,
        storiesByLevelError,
      });
      // Don't throw, just return zeroed data so the page can still render.
      return { storyCount: 0, wordCount: 0, noteCount: 0, storiesByLevel: [] };
    }

    const levelCounts: Record<string, number> = {
      Beginner: 0,
      Intermediate: 0,
      Advanced: 0,
    };

    storiesByLevelData?.forEach(story => {
      if (story.level && levelCounts.hasOwnProperty(story.level)) {
        levelCounts[story.level]++;
      }
    });

    const storiesByLevel: StoriesByLevel[] = Object.entries(levelCounts).map(
      ([level, count]) => ({ level, count })
    );

    return {
      storyCount: storyCount ?? 0,
      wordCount: wordCount ?? 0,
      noteCount: noteCount ?? 0,
      storiesByLevel,
    };
  } catch (error) {
    console.error('Unexpected error in getDashboardMetricsAction:', error);
    return {
      storyCount: 0,
      wordCount: 0,
      noteCount: 0,
      storiesByLevel: [],
    };
  }
}
