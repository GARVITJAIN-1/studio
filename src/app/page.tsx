'use client';

import { useState, useTransition } from 'react';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Send, Bot, AlertTriangle, LogIn, LogOut, User as UserIcon } from 'lucide-react';

import type { GenerateLLMResponseOutput } from '@/ai/flows/generate-llm-response';
import { handleQuery } from '@/app/actions';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Logo } from '@/components/logo';

const formSchema = z.object({
  query: z.string().min(1, { message: 'Query cannot be empty.' }),
});

export default function Home() {
  const [response, setResponse] = useState<GenerateLLMResponseOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { user, signInWithGoogle, logout } = useAuth();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      query: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setError(null);
    setResponse(null);
    startTransition(async () => {
      const result = await handleQuery(values);
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
        <div className="container mx-auto flex max-w-2xl flex-col items-center px-4">
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
                      name="query"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Textarea
                              placeholder="e.g., What is the capital of France?"
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
                  <div className="text-foreground">
                    {response.isAnswerable ? (
                      <p className="whitespace-pre-wrap">{response.response}</p>
                    ) : (
                      <p>I'm sorry, but I am unable to answer that question.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
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
