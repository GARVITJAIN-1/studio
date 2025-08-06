'use client';

import { useState, useTransition, useEffect } from 'react';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Send, Bot, AlertTriangle, LogIn, LogOut, User as UserIcon, History } from 'lucide-react';
import { collection, query, where, onSnapshot, orderBy, Timestamp } from 'firebase/firestore';

import type { ProcessQueryOutput } from '@/ai/schemas/process-query-schema';
import { ProcessQueryInputSchema } from '@/ai/schemas/process-query-schema';
import { processQueryAction } from '@/app/actions';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormMessage, FormLabel } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Logo } from '@/components/logo';
import { Input } from '@/components/ui/input';
import { firestore } from '@/lib/firebase';
import type { Question } from '@/lib/types/question';


const formSchema = ProcessQueryInputSchema;

interface QuestionWithId extends Question {
  id: string;
}

function QuestionHistory() {
  const { user } = useAuth();
  const [history, setHistory] = useState<QuestionWithId[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setHistory([]);
      setLoading(false);
      return;
    };

    setLoading(true);
    const q = query(
        collection(firestore, "questions"), 
        where("userId", "==", user.uid),
        orderBy("askedAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const newHistory: QuestionWithId[] = [];
      querySnapshot.forEach((doc) => {
        newHistory.push({ id: doc.id, ...(doc.data() as Question) });
      });
      setHistory(newHistory);
      setLoading(false);
    }, (error) => {
        console.error("Error fetching question history: ", error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  if (loading) {
    return (
        <Card className="w-full shadow-lg">
            <CardHeader>
                <CardTitle className="flex items-center gap-3 font-headline text-xl"><History /> Question History</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
            </CardContent>
        </Card>
    )
  }

  if (history.length === 0) {
    return (
        <Card className="w-full shadow-lg">
            <CardHeader>
                <CardTitle className="flex items-center gap-3 font-headline text-xl"><History /> Question History</CardTitle>
            </CardHeader>
            <CardContent>
                <p>No questions asked yet.</p>
            </CardContent>
        </Card>
    )
  }

  return (
    <Card className="w-full shadow-lg">
        <CardHeader>
            <CardTitle className="flex items-center gap-3 font-headline text-xl"><History /> Question History</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
            {history.map((item) => (
                <Card key={item.id}>
                    <CardHeader>
                        <CardTitle className="text-lg">{item.questionText}</CardTitle>
                        <CardDescription>
                          Asked at: {item.askedAt ? (item.askedAt as Timestamp).toDate().toLocaleString() : 'N/A'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <p><strong>Answer:</strong> {item.answer}</p>
                        <p><strong>Explanation:</strong> {item.explanation}</p>
                        <div>
                            <strong>Source:</strong>
                            <blockquote className="mt-1 border-l-2 pl-3 italic text-sm text-muted-foreground">
                                {item.context}
                            </blockquote>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </CardContent>
    </Card>
  )
}

export default function Home() {
  const [response, setResponse] = useState<ProcessQueryOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { user, signInWithGoogle, logout } = useAuth();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      documentUrl: '',
      query: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setError(null);
    setResponse(null);
    startTransition(async () => {
      const result = await processQueryAction(values);
      if (result.error) {
        setError(result.error);
        setResponse(null);
      } else if (result.response) {
        setResponse(result.response);
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
                    <FormField
                      control={form.control}
                      name="query"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Question</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="e.g., What is the main topic of the document?"
                              className="resize-none border-2 focus-visible:ring-primary"
                              rows={4}
                              {...field}
                              disabled={isPending}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
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
                   </CardTitle>
                 </CardHeader>
                 <CardContent>
                   <p className="text-foreground">{error}</p>
                 </CardContent>
               </Card>
             )}

            {response && (
              <Card className="w-full animate-in fade-in-50 shadow-lg">
                <CardHeader className="flex flex-row items-center gap-3">
                  <Bot className="h-6 w-6" />
                  <CardTitle className="font-headline text-xl">Response</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-sm text-foreground bg-muted p-4 rounded-md overflow-x-auto">
                    {JSON.stringify(response, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            )}
          </div>
          {user && <QuestionHistory />}
        </div>
      </main>
      <footer className="container mx-auto py-8 text-center text-muted-foreground">
        <p>Powered by Firebase and Genkit</p>
      </footer>
    </div>
  );
}
