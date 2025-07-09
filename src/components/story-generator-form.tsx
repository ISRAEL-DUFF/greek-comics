'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { useToast } from "@/hooks/use-toast";
import { generateStoryAction, type StoryResult } from '@/app/actions';
import { StoryFormSchema } from '@/lib/schemas';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Loader2 } from 'lucide-react';

type StoryGeneratorFormProps = {
  setIsLoading: (isLoading: boolean) => void;
  setStoryResult: (result: StoryResult | null) => void;
  isLoading: boolean;
};

type StoryFormValues = z.infer<typeof StoryFormSchema>;

export function StoryGeneratorForm({ setIsLoading, setStoryResult, isLoading }: StoryGeneratorFormProps) {
  const { toast } = useToast();
  const form = useForm<StoryFormValues>({
    resolver: zodResolver(StoryFormSchema),
    defaultValues: {
      level: 'Beginner',
      topic: 'A cat is in the house',
      grammarScope: 'Present tense verbs, singular nouns, basic prepositions',
    },
  });

  const onSubmit = async (values: StoryFormValues) => {
    setIsLoading(true);
    setStoryResult(null);
    
    const formData = new FormData();
    formData.append('level', values.level);
    formData.append('topic', values.topic);
    formData.append('grammarScope', values.grammarScope);

    const result = await generateStoryAction(formData);

    setIsLoading(false);
    
    if (result.error) {
      toast({
        variant: 'destructive',
        title: 'Failed to Generate Story',
        description: result.error,
      });
      if (result.fieldErrors) {
        // You could optionally set form errors here if needed
      }
    } else {
      setStoryResult(result);
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Create Your Story</CardTitle>
        <CardDescription>Fill in the details below to generate a new illustrated story.</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="level"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Learner Level</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Beginner">Beginner</SelectItem>
                      <SelectItem value="Intermediate">Intermediate</SelectItem>
                      <SelectItem value="Advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="topic"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Story Topic</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., A dog chasing a rabbit" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="grammarScope"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Grammar Scope</FormLabel>
                  <FormControl>
                    <Textarea placeholder="e.g., Present indicative, aorist participles" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isLoading} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              {isLoading ? 'Generating...' : 'Generate Story'}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
