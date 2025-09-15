
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
import { VocabMemorizeFormSchema } from '../schema';

type VocabMemorizeFormProps = {
  setIsLoading: (isLoading: boolean) => void;
  setBookResult: (result: BookResult | null) => void;
  isLoading: boolean;
};

type VocabMemorizeFormValues = z.infer<typeof VocabMemorizeFormSchema>;

export function VocabMemorizeForm({ setIsLoading, setBookResult, isLoading }: VocabMemorizeFormProps) {
  const { toast } = useToast();
  const form = useForm<VocabMemorizeFormValues>({
    resolver: zodResolver(VocabMemorizeFormSchema),
    defaultValues: {
      level: 'Intermediate',
      vocabList: 'λόγος, ἀγαθός, θεός, ἄνθρωπος, ἔργον',
      grammarScope: 'Aorist and Imperfect tenses, genitive absolute',
      numPages: 3,
    },
  });

  const onSubmit = async (values: VocabMemorizeFormValues) => {
    setIsLoading(true);
    setBookResult(null);
    
    const formData = new FormData();
    formData.append('level', values.level);
    formData.append('vocabList', values.vocabList);
    formData.append('grammarScope', values.grammarScope);
    formData.append('numPages', values.numPages.toString());

    const result = await generateBookAction(formData);

    setIsLoading(false);
    
    if (result.error) {
      toast({
        variant: 'destructive',
        title: 'Failed to Generate Story',
        description: result.error,
      });
      if (result.fieldErrors) {
        if(result.fieldErrors.numPages){
          form.setError("numPages", { type: "manual", message: result.fieldErrors.numPages.join(', ') });
        }
         if(result.fieldErrors.vocabList){
          form.setError("vocabList", { type: "manual", message: result.fieldErrors.vocabList.join(', ') });
        }
      }
    } else {
      setBookResult(result);
    }
  };

  return (
    <Card className="shadow-lg border-0 md:border md:shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Create Your Story</CardTitle>
        <CardDescription>Enter a vocab list to generate a story for memorization.</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
             <FormField
              control={form.control}
              name="vocabList"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vocabulary List (comma-separated)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="e.g., λόγος, ἀγαθός, θεός" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
              {isLoading ? 'Generating...' : 'Generate Story'}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
