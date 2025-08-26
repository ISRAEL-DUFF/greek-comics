
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from "@/hooks/use-toast";
import { generateBookAction, type BookResult } from '../actions';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Loader2 } from 'lucide-react';

type BookGeneratorFormProps = {
  setIsLoading: (isLoading: boolean) => void;
  setBookResult: (result: BookResult | null) => void;
  isLoading: boolean;
};

export const BookFormSchema = z.object({
  level: z.enum(['Beginner', 'Intermediate', 'Advanced']),
  topic: z.string().min(3, 'Topic must be at least 3 characters long.').max(100, 'Topic must be 100 characters or less.'),
  grammarScope: z.string().min(3, 'Grammar scope must be at least 3 characters long.').max(100, 'Grammar scope must be 100 characters or less.'),
  numPages: z.coerce.number().int().min(1, 'Must be at least 1 page.').max(10, 'Cannot be more than 10 pages.').default(3),
});

type BookFormValues = z.infer<typeof BookFormSchema>;

export function BookGeneratorForm({ setIsLoading, setBookResult, isLoading }: BookGeneratorFormProps) {
  const { toast } = useToast();
  const form = useForm<BookFormValues>({
    resolver: zodResolver(BookFormSchema),
    defaultValues: {
      level: 'Intermediate',
      topic: 'The Odyssey of a Reluctant Hero',
      grammarScope: 'Aorist and Imperfect tenses, genitive absolute, purpose clauses',
      numPages: 3,
    },
  });

  const onSubmit = async (values: BookFormValues) => {
    setIsLoading(true);
    setBookResult(null);
    
    const formData = new FormData();
    formData.append('level', values.level);
    formData.append('topic', values.topic);
    formData.append('grammarScope', values.grammarScope);
    formData.append('numPages', values.numPages.toString());

    const result = await generateBookAction(formData);

    setIsLoading(false);
    
    if (result.error) {
      toast({
        variant: 'destructive',
        title: 'Failed to Generate Book',
        description: result.error,
      });
      if (result.fieldErrors) {
        if(result.fieldErrors.numPages){
          form.setError("numPages", { type: "manual", message: result.fieldErrors.numPages.join(', ') });
        }
      }
    } else {
      setBookResult(result);
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Create Your Book</CardTitle>
        <CardDescription>Fill in the details below to generate a new book.</CardDescription>
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
                  <FormLabel>Book Topic</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., A journey through the underworld" {...field} />
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
                    <Textarea placeholder="e.g., Optative mood, indirect discourse" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="numPages"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Number of Pages</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
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
              {isLoading ? 'Generating...' : 'Generate Book'}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
