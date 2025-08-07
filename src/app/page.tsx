
'use client';

import { useState, useTransition } from 'react';
import Image from 'next/image';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Send, Bot, AlertTriangle, LogIn, LogOut, User as UserIcon, Plus, X } from 'lucide-react';
import { getFunctions, httpsCallable } from 'firebase/functions';

import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormMessage, FormLabel } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Logo } from '@/components/logo';
import { Input } from '@/components/ui/input';
import { app } from '@/lib/firebase';
import { toast } from '@/hooks/use-toast';

// Define the expected output from the function for a single question
interface ProcessQueryOutput {
  answer: string;
  explanation: string;
  source: string;
  questionText: string;
}

// Define the schema for the form
const formSchema = z.object({
  documentUrl: z.string().url({ message: 'Please enter a valid URL.' }),
  questions: z.array(z.object({
    value: z.string().min(1, { message: 'Question cannot be empty.' }),
  })).min(1, { message: 'Please ask at least one question.' }),
});

export default function Home() {
  const [responses, setResponses] = useState<ProcessQueryOutput[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { user, signInWithGoogle, logout } = useAuth();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      documentUrl: '',
      questions: [{ value: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "questions"
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setError(null);
    setResponses([]);

    if (!app) {
      setError("Firebase is not initialized. Please check your configuration.");
      return;
    }

    startTransition(async () => {
      try {
        const functions = getFunctions(app, 'us-central1');
        const processQuery = httpsCallable(functions, 'processQuery');
        
        const questionsArray = values.questions.map(q => q.value);

        const result: any = await processQuery({ 
          documentUrl: values.documentUrl,
          queries: questionsArray,
        });
        
        const data = result.data as ProcessQueryOutput[];
        setResponses(data);

      } catch (e: any) {
        console.error(e);
        const errorMessage = e.message || 'An unexpected error occurred.';
        setError(errorMessage);
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive"
        });
      }
    });
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="container mx-auto flex items-center justify-between py-8 sm:py-12">
        <Logo />
        {user ? (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {user.photoURL ? (
                  <Image src={user.photoURL} alt={user.displayName || 'User'} width={32} height={32} className="rounded-full" />
              ) : (
                <UserIcon className="h-8 w-8 rounded-full border p-1" />
              )}
              <span className="hidden sm:inline">{user.displayName}</span>
            </div>
            <Button variant="outline" onClick={logout}>
              <LogOut />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        ) : (
          <Button onClick={signInWithGoogle}>
            <LogIn />
            Sign in with Google
          </Button>
        )}
      </header>
      <main className="flex-1">
        <div className="container mx-auto flex max-w-2xl flex-col items-center px-4 space-y-8">
          <div className="w-full space-y-6">
            <Card className="w-full shadow-lg">
              <CardHeader>
                <CardTitle className="font-headline text-xl">Ask QueryFire</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="documentUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Document URL</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="https://example.com/document.pdf"
                              {...field}
                              disabled={isPending}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {fields.map((item, index) => (
                       <FormField
                          key={item.id}
                          control={form.control}
                          name={`questions.${index}.value`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Question {index + 1}</FormLabel>
                              <FormControl>
                                <div className="flex items-center gap-2">
                                <Textarea
                                  placeholder="e.g., What is the main topic of the document?"
                                  className="resize-none border-2 focus-visible:ring-primary"
                                  rows={2}
                                  {...field}
                                  disabled={isPending}
                                />
                                {fields.length > 1 && (
                                  <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)} disabled={isPending}>
                                    <X className="h-4 w-4" />
                                  </Button>
                                )}
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                    ))}

                    <Button type="button" variant="outline" onClick={() => append({ value: "" })} disabled={isPending}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Question
                    </Button>
                    
                    <Button type="submit" disabled={isPending} className="w-full text-lg">
                      {isPending ? (
                        <Loader2 className="animate-spin" />
                      ) : (
                        <Send />
                      )}
                      <span>{isPending ? 'Thinking...' : 'Send Query'}</span>
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            {isPending && (
              <Card className="w-full shadow-lg">
                <CardHeader className="flex flex-row items-center gap-3">
                  <Bot className="h-6 w-6" />
                  <CardTitle className="font-headline text-xl">Response</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Skeleton className="h-4 w-[80%]" />
                  <Skeleton className="h-4 w-[90%]" />
                  <Skeleton className="h-4 w-[60%]" />
                </CardContent>
              </Card>
            )}

            {error && (
               <Card className="w-full border-destructive shadow-lg">
                 <CardHeader>
                   <CardTitle className="flex items-center gap-2 font-headline text-destructive">
                     <AlertTriangle />
                     Error
                   </Title>
                 </CardHeader>
                 <CardContent>
                   <p className="text-foreground">{error}</p>
                 </CardContent>
               </Card>
             )}

            {responses.length > 0 && (
              <div className="w-full space-y-4">
                {responses.map((response, index) => (
                  <Card key={index} className="w-full animate-in fade-in-50 shadow-lg">
                    <CardHeader className="flex flex-row items-center gap-3">
                      <Bot className="h-6 w-6" />
                      <CardTitle className="font-headline text-xl">Response to: "{response.questionText}"</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                       <div>
                         <p className="font-semibold">Answer:</p>
                         <p>{response.answer}</p>
                       </div>
                       <div>
                         <p className="font-semibold">Explanation:</p>
                         <p>{response.explanation}</p>
                       </div>
                       <div>
                         <p className="font-semibold">Source:</p>
                         <blockquote className="mt-1 border-l-2 pl-3 italic text-sm text-muted-foreground">
                            {response.source}
                         </blockquote>
                       </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      <footer className="container mx-auto py-8 text-center text-muted-foreground">
        <p>Powered by Firebase and Genkit</p>
      </footer>
    </div>
  );
}
